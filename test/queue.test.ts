import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../packages/runtime/src/store.js';
import { Queue } from '../packages/runtime/src/queue.js';
test('durable keys deduplicate; interrupted running jobs require review rather than retry', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bili-dragon-test-'));
  t.onTestFinished(() => fs.rmSync(dir, { recursive: true, force: true }));
  const s = new Store(dir),
    q = new Queue(s);
  q.add('dm:1', 'dm', { text: 'hello' });
  q.add('dm:1', 'dm', { text: 'hello' });
  assert.equal(q.list().length, 1);
  const job = q.claim();
  assert.ok(job);
  assert.equal(job.state, 'running');
  new Queue(s).recover();
  assert.equal(q.list()[0].state, 'needs-review');
  assert.equal(q.claim(), null);
  q.dismiss(job.id);
  assert.equal(q.list()[0].state, 'dismissed');
});
