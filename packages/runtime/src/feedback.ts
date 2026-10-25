import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { atomic, exclusive } from './store.js';
import { errorCode } from './types.js';
import type { InboxEvent } from './types.js';

export interface FeedbackObservation {
  id: string;
  mid: string;
  kind: 'message' | 'like';
  at: string;
  text: string;
  bvid?: string;
}
interface FeedbackSource {
  state: 'ok' | 'unknown' | 'disabled';
  at: string;
  error?: string;
}
interface FeedbackState {
  ownerMid?: string;
  last?: string | null;
  events?: { at: string; eventId?: string; note: string }[];
  observations?: FeedbackObservation[];
  seenIds?: string[];
  sources?: Partial<Record<'comments' | 'likes', FeedbackSource>>;
}
export function eventTime(value: number | string | undefined) {
  const time = typeof value === 'number' ? value * 1000 : Date.parse(value ?? '');
  return Number.isFinite(time) && time > 0 && time <= Date.now() + 60000
    ? new Date(Math.min(time, Date.now())).toISOString()
    : undefined;
}

export class Feedback {
  file: string;
  owner: () => string;
  constructor(dir: string, owner: () => string) {
    this.file = path.join(dir, '.bili-ai/feedback.json');
    this.owner = owner;
  }
  private read(): FeedbackState {
    let state: FeedbackState;
    try {
      state = JSON.parse(fs.readFileSync(this.file, 'utf8'));
    } catch (error) {
      if (errorCode(error) === 'ENOENT') return {};
      throw Error('反馈记录无法读取，未重置互动时间');
    }
    return state.ownerMid && state.ownerMid !== this.owner() ? {} : state;
  }
  private update(change: (state: FeedbackState) => void) {
    const release = exclusive(this.file + '.lock');
    try {
      const state = this.read();
      change(state);
      state.ownerMid = this.owner();
      atomic(this.file, state);
    } finally {
      release();
    }
  }
  status(commentsEnabled = true) {
    const state = this.read();
    const sources = { ...state.sources };
    if (!commentsEnabled)
      for (const source of ['comments', 'likes'] as const)
        sources[source] = { state: 'disabled', at: sources[source]?.at ?? '' };
    return {
      last: state.last ?? null,
      observations: state.observations ?? [],
      sources,
    };
  }
  source(name: 'comments' | 'likes', state: FeedbackSource['state'], error?: string) {
    this.update((data) => {
      data.sources = {
        ...data.sources,
        [name]: { state, at: new Date().toISOString(), ...(error ? { error } : {}) },
      };
    });
  }
  record(observation: FeedbackObservation) {
    if (!this.owner() || observation.mid !== this.owner() || !eventTime(observation.at)) return;
    this.update((state) => {
      if (
        state.seenIds?.includes(observation.id) ||
        state.events?.some((e) => e.eventId === observation.id)
      )
        return;
      state.seenIds = [...(state.seenIds ?? []), observation.id].slice(-5000);
      state.observations = [...(state.observations ?? []), observation].slice(-200);
      state.events = [
        ...(state.events ?? []),
        {
          at: observation.at,
          eventId: observation.id,
          note: observation.kind === 'like' ? '收到主人的点赞' : '收到主人的文字回应',
        },
      ].slice(-200);
      if (!state.last || Date.parse(observation.at) > Date.parse(state.last))
        state.last = observation.at;
    });
  }
  message(event: InboxEvent) {
    if (event.inactive || !event.text.trim() || event.text === '(读不到正文)') return;
    const at = eventTime(event.time) ?? eventTime(event.receivedAt);
    if (!at) return;
    const bvid = event.bvid ?? event.uri?.match(/BV[0-9A-Za-z]{10}/)?.[0];
    this.record({
      id: event.id,
      mid: event.mid,
      kind: 'message',
      at,
      text: event.text,
      ...(bvid ? { bvid } : {}),
    });
  }
  likes(raw: unknown) {
    const result = z
      .object({
        items: z.array(
          z.object({
            id: z.union([z.string(), z.number()]),
            users: z.array(z.object({ mid: z.union([z.string(), z.number()]) })),
            like_time: z.number(),
            item: z.object({ uri: z.string().optional(), title: z.string().optional() }).optional(),
          }),
        ),
      })
      .parse(raw);
    for (const item of result.items) {
      if (!item.users.some((user) => String(user.mid) === this.owner())) continue;
      const at = eventTime(item.like_time);
      if (!at) continue;
      const bvid = item.item?.uri?.match(/BV[0-9A-Za-z]{10}/)?.[0];
      // A grouped notification's timestamp can change when another person likes it.
      // Its stable id + the verified owner prevents refreshing the same reaction.
      this.record({
        id: `like:${item.id}:${this.owner()}`,
        mid: this.owner(),
        kind: 'like',
        at,
        text: item.item?.title?.slice(0, 300) ?? '',
        ...(bvid ? { bvid } : {}),
      });
    }
  }
}

const identifier = z.union([z.string(), z.number()]);
export function commentEvents(raw: unknown): InboxEvent[] {
  const data = z
    .object({
      ok: z.literal(true),
      items: z.array(
        z.object({
          id: identifier.optional(),
          kind: z.enum(['reply', 'at']).default('reply'),
          mid: identifier,
          text: z.string(),
          time: z.union([z.string(), z.number()]).optional(),
          rpid: identifier.optional(),
          oid: identifier.optional(),
          root: identifier.optional(),
          business: identifier.optional(),
          uri: z.string().optional(),
          who: z.string().optional(),
        }),
      ),
    })
    .parse(raw);
  return data.items.map(({ id, kind, who, ...item }) => {
    if (id === undefined && item.rpid === undefined) throw Error('评论缺少事件标识');
    return {
      ...item,
      id: `comment:${kind}:${id ?? item.rpid}`,
      mid: String(item.mid),
      channel: 'comments',
      name: who,
    };
  });
}
