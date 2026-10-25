import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { Store } from './store.js';

export interface UpdateState {
  status:
    | 'idle'
    | 'checking'
    | 'downloading'
    | 'waiting'
    | 'reload-required'
    | 'switching'
    | 'updated'
    | 'error';
  checkedAt?: string;
  availableVersion?: string;
  failedVersion?: string;
  message?: string;
}
export const updateState = (dir: string) =>
  new Store(dir).read<UpdateState>('update-state', { status: 'idle' });
export const transitionPath = (dir: string) => path.join(dir, 'updates/transition.json');
const transitionSchema = z.object({
  oldRoot: z.string(),
  newRoot: z.string(),
  version: z.string(),
  oldPid: z.number().int().positive(),
  token: z.string().min(40),
  startedAt: z.number(),
  runnerPid: z.number().int().positive().optional(),
});
export type Transition = z.infer<typeof transitionSchema>;
export function readTransition(dir: string): Transition | null {
  if (!fs.existsSync(transitionPath(dir))) return null;
  return transitionSchema.parse(JSON.parse(fs.readFileSync(transitionPath(dir), 'utf8')));
}
export function activeRoot(dir: string, fallback: string) {
  const file = path.join(dir, 'updates/active.json');
  if (!fs.existsSync(file)) return fallback;
  const value = z
    .object({ root: z.string(), version: z.string() })
    .parse(JSON.parse(fs.readFileSync(file, 'utf8')));
  const relative = path.relative(path.join(dir, 'updates/versions'), value.root);
  if (!/^\d+\.\d+\.\d+-[a-f0-9]{64}$/.test(relative)) throw Error('自动更新目录记录无效');
  return value.root;
}
