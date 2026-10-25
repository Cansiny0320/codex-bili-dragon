import type { Config } from './config.js';
import type { LoginAccount } from './login.js';

export type Channel = 'comments' | 'dm' | 'live';
export type WriteChannel = Channel | 'favorites';
export type JobState = 'pending' | 'running' | 'done' | 'needs-review' | 'dismissed';
export interface Job {
  id: string;
  key: string;
  type: string;
  payload: { [key: string]: unknown; manual?: boolean; eventId?: string };
  state: JobState;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  result?: unknown;
}
export interface InboxEvent {
  id: string;
  channel: Channel;
  mid: string;
  text: string;
  receivedAt?: string;
  inactive?: boolean;
  name?: string;
  uname?: string;
  bvid?: string;
  title?: string;
  time?: number | string;
  oid?: string | number;
  rpid?: string | number;
  root?: string | number;
  business?: string | number;
  uri?: string;
  room?: string;
  dmid?: string;
}
export interface Draft {
  id: string;
  eventId: string;
  text: string;
  createdAt: string;
  state: 'draft' | 'sending' | 'sent' | 'rejected' | 'needs-review';
}
export interface Diary {
  id: string;
  bvid?: string;
  title: string;
  publicText: string;
  privateText: string;
  evidence: string;
  at: string;
  learning?: Learning;
  ownerMid?: string;
}
export interface Learning {
  confirmed: { text: string; sourceIds: string[] }[];
  tentative: { text: string; sourceIds: string[] }[];
  interests: string[];
  nextTopics: string[];
}
export interface Operation {
  key: string;
  channel: WriteChannel;
  state: 'sending' | 'confirmed' | 'needs-review';
  at: string;
  result?: string;
  error?: string;
  jobId?: string;
  bvid?: string;
  kind?: string;
  activityId?: string;
  text?: string;
  targetMid?: string;
  targetName?: string;
  link?: string;
}
export interface Evidence {
  actions: string[];
  at: string;
  title?: string;
  cover?: string;
  author?: string;
  duration?: number;
  materials?: Record<string, string>;
  attempts?: Record<string, { at: string; state: 'success' | 'failed'; error?: string }>;
}
export interface Activity {
  id: string;
  at: string;
  finishedAt?: string;
  action: string;
  source: 'autonomous' | 'manual' | 'chat' | 'unknown';
  state: 'running' | 'success' | 'failed' | 'unknown' | 'draft';
  summary: string;
  jobId?: string;
  bvid?: string;
  channel?: WriteChannel;
  text?: string;
  textIncomplete?: boolean;
  targetMid?: string;
  targetName?: string;
  link?: string;
  error?: string;
  referenceId?: string;
  legacy?: boolean;
}
export interface RuntimeState {
  state?: string;
  startedAt?: string;
  jobId?: string | null;
  error?: string | null;
  lastErrorAt?: string;
}
export interface ScheduleState {
  action: 'browse' | 'skip' | 'done';
  used: Record<string, number>;
  signature: string;
  lastAt: number;
  windowKey?: string;
  startsAt?: number;
  endsAt?: number;
  atMs?: number;
  fired?: boolean;
}
export interface ListenerState {
  ok: boolean;
  at?: string;
  error?: string;
  nextAt?: string;
}
export interface Database {
  config: Config;
  account: LoginAccount | null;
  jobs: Job[];
  inbox: InboxEvent[];
  drafts: Draft[];
  diaries: Diary[];
  operations: Operation[];
  activities: Activity[];
  evidence: Record<string, Evidence>;
  runtime: RuntimeState;
  schedule: Partial<ScheduleState>;
  'listener-status': Partial<Record<Channel, ListenerState>>;
  'comment-cursor': { ids: string[] } | null;
  'codex-session': { threadId?: string; toolSignature?: string };
  'codex-error': { message: string };
}
export interface ToolResult {
  [key: string]: unknown;
  content: ({ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string })[];
  isError?: boolean;
}
export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: { type: 'object'; [key: string]: unknown };
  call: (args: unknown) => Promise<ToolResult>;
}
export interface RunOptions {
  channel?: WriteChannel | '';
  timeout?: number;
  signal?: AbortSignal;
}
export interface RunResult {
  code: number;
  out: string;
  err: string;
}
export type ToolRunner = (args: string[], options?: RunOptions) => Promise<RunResult>;
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
export const errorCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
