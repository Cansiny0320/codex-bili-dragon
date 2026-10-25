import crypto from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { z } from 'zod';
import type { Store } from './store.js';
import type { Activity, Operation } from './types.js';
import { errorMessage } from './types.js';
import { redact } from './upstream.js';
import { readConfig } from './config.js';

export const activityInput = z
  .object({
    type: z.string().max(30).optional(),
    state: z.enum(['running', 'success', 'failed', 'unknown', 'draft']).optional(),
    offset: z.number().int().min(0).default(0),
    limit: z.number().int().min(1).max(100).default(30),
  })
  .strict();
export type ActivityContext = Pick<Activity, 'source' | 'jobId'>;
const labels: Record<string, string> = {
  search: '搜索视频',
  video: '读取视频信息',
  subtitles: '读取字幕',
  comments: '读取评论',
  frames: '查看画面',
  debrief: '读取简报',
  feed: '读取推荐',
  session: '检查登录',
  quota: '查看配额',
  'live-history': '读取直播消息',
  diary: '写日记',
  share: '分享视频',
  reply: '回复消息',
  favorite: '收藏视频',
  feedback: '查看反馈',
  approve: '审核发送',
  reject: '拒绝草稿',
};

export function operationDetail(operation: Operation) {
  const raw = operation.result ?? '';
  const body = raw.match(/^\s*body\s*:\s*(.+)$/m)?.[1];
  const sentText = body ? (new URLSearchParams(body).get('message') ?? undefined) : undefined;
  const dm = raw.match(/正文\s+(\d+)\s+字：([^\r\n]*)/);
  const text = sentText ?? operation.text ?? dm?.[2];
  const textIncomplete = !sentText && !operation.text && !!dm && Number(dm[1]) > dm[2].length;
  const link =
    operation.link ??
    raw.match(/https:\/\/www\.bilibili\.com\/video\/BV[0-9A-Za-z]{10}\/?#reply\d+/)?.[0];
  const recipient = raw.match(/→\s*(.+?)（mid\s+(\d+)）/);
  return {
    text,
    textIncomplete,
    link,
    targetMid:
      operation.targetMid ?? recipient?.[2] ?? operation.key.match(/^reply:dm:(\d+):/)?.[1],
    targetName: operation.targetName ?? recipient?.[1],
    bvid:
      operation.bvid ??
      operation.key.match(/^share:(BV[0-9A-Za-z]{10})$/)?.[1] ??
      link?.match(/BV[0-9A-Za-z]{10}/)?.[0],
    channel: operation.channel,
  };
}

export class ActivityLog {
  private context = new AsyncLocalStorage<string>();
  constructor(private store: Store) {}
  currentId() {
    return this.context.getStore();
  }
  private clean(text: string) {
    return redact(text, this.store.dir);
  }
  async run<T>(
    name: string,
    input: unknown,
    context: ActivityContext,
    fn: () => T | Promise<T>,
  ): Promise<T> {
    const args =
      input && typeof input === 'object' ? ({ ...input } as Record<string, unknown>) : {};
    const action =
      name === 'dragon_read' && typeof args.action === 'string'
        ? args.action
        : name.replace(/^dragon_/, '');
    const id = crypto.randomUUID();
    const row: Activity = {
      id,
      at: new Date().toISOString(),
      action,
      ...context,
      state: 'running',
      summary: labels[action] ?? action,
      ...(typeof args.bvid === 'string' ? { bvid: args.bvid } : {}),
      ...(typeof args.text === 'string' ? { text: this.clean(args.text) } : {}),
      ...(typeof args.id === 'string' ? { referenceId: args.id } : {}),
    };
    if (typeof args.query === 'string') row.summary += '：' + this.clean(args.query);
    if (typeof args.title === 'string') row.summary += '：' + this.clean(args.title);
    if (action === 'share') {
      const config = readConfig(this.store);
      row.channel = config.share.via === 'dm' ? 'dm' : 'comments';
      row.targetMid = config.owner.mid;
      row.targetName = config.owner.name;
    }
    if (action === 'favorite') {
      row.channel = 'favorites';
      row.text = typeof args.reason === 'string' ? this.clean(args.reason) : undefined;
    }
    if (['approve', 'reject'].includes(action) && typeof args.id === 'string') {
      const draft = this.store.read('drafts', []).find((item) => item.id === args.id);
      if (draft) {
        row.text = this.clean(draft.text);
        args.eventId = draft.eventId;
      }
    }
    if (typeof args.eventId === 'string') {
      if (action === 'reply') row.referenceId = args.eventId;
      const event = this.store.read('inbox', []).find((event) => event.id === args.eventId);
      if (event)
        Object.assign(row, {
          channel: event.channel,
          targetMid: event.mid,
          targetName: event.name ?? event.uname,
          bvid: event.bvid,
        });
    }
    this.store.update('activities', [], (rows) => {
      rows.push(row);
    });
    const finish = (state: Activity['state'], error?: string) => {
      const operation = this.store.read('operations', []).find((op) => op.activityId === id);
      this.store.update('activities', [], (rows) => {
        const current = rows.find((item) => item.id === id)!;
        Object.assign(current, {
          state,
          finishedAt: new Date().toISOString(),
          ...(error ? { error: this.clean(error).slice(0, 2000) } : {}),
        });
        if (operation)
          Object.assign(current, operationDetail(operation), {
            state: operation.state === 'confirmed' ? 'success' : 'unknown',
            ...(operation.error ? { error: this.clean(operation.error) } : {}),
          });
      });
    };
    return this.context.run(id, async () => {
      try {
        const result = await fn();
        if (result && typeof result === 'object' && 'isError' in result && result.isError) {
          finish('failed', '工具读取失败，未取得这次结果。');
        } else
          finish(
            result && typeof result === 'object' && 'state' in result && result.state === 'draft'
              ? 'draft'
              : 'success',
          );
        return result;
      } catch (error) {
        finish('failed', errorMessage(error));
        throw error;
      }
    });
  }
  recover() {
    this.store.update('activities', [], (rows) => {
      for (const row of rows)
        if (row.state === 'running') {
          row.state = 'unknown';
          row.error = '上次运行中断，结果未确认。';
        }
    });
  }
  list(input: z.input<typeof activityInput> = {}) {
    const query = activityInput.parse(input);
    const rows = this.store.read('activities', []);
    const operations = this.store.read('operations', []);
    for (const operation of operations) {
      const existing = rows.find((row) => row.id === operation.activityId);
      if (existing) {
        Object.assign(existing, operationDetail(operation), {
          state:
            operation.state === 'confirmed'
              ? 'success'
              : existing.state === 'running' && operation.state === 'sending'
                ? 'running'
                : 'unknown',
          error: operation.error ? this.clean(operation.error) : undefined,
        });
        continue;
      }
      rows.push({
        id: 'operation:' + operation.key,
        at: operation.at,
        action:
          operation.channel === 'favorites'
            ? 'favorite'
            : operation.key.startsWith('share:')
              ? 'share'
              : 'reply',
        source: 'unknown',
        state: operation.state === 'confirmed' ? 'success' : 'unknown',
        summary:
          operation.channel === 'favorites'
            ? '收藏视频'
            : operation.channel === 'dm'
              ? '发送私信'
              : '发送评论',
        ...operationDetail(operation),
        error: operation.error ? this.clean(operation.error) : undefined,
        legacy: true,
      });
    }
    for (const draft of this.store.read('drafts', [])) {
      if (
        rows.some((row) => row.action === 'reply' && row.referenceId === draft.eventId) ||
        operations.some((operation) => operation.key === 'reply:' + draft.eventId)
      )
        continue;
      const event = this.store.read('inbox', []).find((event) => event.id === draft.eventId);
      rows.push({
        id: 'draft:' + draft.id,
        at: draft.createdAt,
        action: 'reply',
        source: 'unknown',
        state:
          draft.state === 'draft'
            ? 'draft'
            : draft.state === 'sent'
              ? 'success'
              : draft.state === 'rejected'
                ? 'failed'
                : 'unknown',
        summary: '回复草稿',
        text: this.clean(draft.text),
        channel: event?.channel,
        targetMid: event?.mid,
        targetName: event?.name ?? event?.uname,
        bvid: event?.bvid,
        legacy: true,
      });
    }
    for (const job of this.store.read('jobs', []))
      rows.push({
        id: 'job:' + job.id,
        jobId: job.id,
        at: job.startedAt ?? job.createdAt,
        finishedAt: job.finishedAt,
        action: 'task',
        source: job.payload.manual ? 'manual' : 'autonomous',
        state:
          job.state === 'done'
            ? 'success'
            : job.state === 'needs-review'
              ? 'unknown'
              : job.state === 'dismissed'
                ? 'failed'
                : 'running',
        summary: job.type === 'browse' ? '逛 B 站' : '处理消息',
        text:
          job.result &&
          typeof job.result === 'object' &&
          'summary' in job.result &&
          typeof job.result.summary === 'string'
            ? this.clean(job.result.summary)
            : undefined,
        error:
          typeof job.result === 'string' && job.state !== 'done'
            ? this.clean(job.result)
            : undefined,
      });
    for (const diary of this.store.read('diaries', [])) {
      if (rows.some((row) => row.action === 'diary' && row.referenceId === diary.id)) continue;
      rows.push({
        id: 'diary:' + diary.id,
        at: diary.at,
        action: 'diary',
        source: 'unknown',
        state: 'success',
        summary: '写日记：' + diary.title,
        bvid: diary.bvid,
        referenceId: diary.id,
        legacy: true,
      });
    }
    for (const [bvid, evidence] of Object.entries(this.store.read('evidence', {}))) {
      if (
        rows.some(
          (row) =>
            row.bvid === bvid &&
            ['video', 'subtitles', 'comments', 'frames', 'debrief'].includes(row.action),
        )
      )
        continue;
      rows.push({
        id: 'evidence:' + bvid,
        at: evidence.at,
        action: 'read',
        source: 'unknown',
        state: 'success',
        summary: '历史素材：' + (evidence.title || bvid),
        bvid,
        text: evidence.actions.map((action) => labels[action] ?? action).join('、'),
        legacy: true,
      });
    }
    const filtered = rows
      .filter(
        (row) =>
          (!query.type ||
            (query.type.startsWith('sent:')
              ? row.channel === query.type.slice(5) &&
                row.state === 'success' &&
                ['share', 'reply', 'approve'].includes(row.action)
              : ['dm', 'comments', 'live'].includes(query.type)
                ? row.channel === query.type
                : query.type === 'read'
                  ? [
                      'read',
                      'video',
                      'subtitles',
                      'comments',
                      'frames',
                      'debrief',
                      'feed',
                      'live-history',
                      'session',
                      'quota',
                    ].includes(row.action)
                  : row.action === query.type)) &&
          (!query.state || row.state === query.state),
      )
      .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id));
    return {
      total: filtered.length,
      items: filtered.slice(query.offset, query.offset + query.limit),
    };
  }
}
