import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Store } from '../packages/runtime/src/store.js';
import { ActivityLog } from '../packages/runtime/src/activity.js';
import { DragonService, catalog } from '../packages/runtime/src/service.js';

test('并发工具调用保留独立来源、完整正文和未知发送结果，不保存原始工具日志', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-activity-'));
  const store = new Store(dir),
    log = new ActivityLog(store);
  try {
    let finish!: () => void;
    const held = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const background = log.run(
      'dragon_share',
      { text: '完整分享正文', bvid: 'BV1234567890' },
      { source: 'autonomous', jobId: 'job-1' },
      async () => {
        const id = log.currentId();
        await held;
        assert.equal(log.currentId(), id);
        store.write('operations', [
          {
            key: 'share:BV1234567890',
            channel: 'dm',
            state: 'needs-review',
            at: new Date().toISOString(),
            activityId: id,
            text: '完整分享正文 https://www.bilibili.com/video/BV1234567890',
            targetMid: '12',
            error: '工具超时，发送结果未确认',
          },
        ]);
        throw Error('工具超时，发送结果未确认');
      },
    );
    await log.run(
      'dragon_read',
      { action: 'search', query: '科技' },
      { source: 'chat' },
      async () => ({ content: [{ type: 'text', text: 'cookie=never-store-this' }] }),
    );
    finish();
    await assert.rejects(background);
    const rows = log.list({ limit: 50 }).items;
    const share = rows.find((row) => row.action === 'share')!;
    assert.equal(share.state, 'unknown');
    assert.equal(share.jobId, 'job-1');
    assert.equal(share.source, 'autonomous');
    assert.ok(share.text?.endsWith('BV1234567890'));
    assert.equal(rows.find((row) => row.action === 'search')?.source, 'chat');
    assert.ok(!JSON.stringify(rows).includes('never-store-this'));
    assert.equal(rows.length, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('历史记录回填完整评论和不完整私信，筛选分页不丢弃历史', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-history-'));
  const store = new Store(dir),
    log = new ActivityLog(store);
  try {
    store.write('operations', [
      {
        key: 'share:BV1234567890',
        channel: 'comments',
        state: 'confirmed',
        at: '2026-01-01T00:00:00Z',
        result:
          'body   : type=1&message=%E5%AE%8C%E6%95%B4%E6%AD%A3%E6%96%87&csrf=secret\nhttps://www.bilibili.com/video/BV1234567890/#reply123',
      },
      {
        key: 'reply:dm:12:34',
        channel: 'dm',
        state: 'confirmed',
        at: '2026-01-02T00:00:00Z',
        result: '正文 298 字：片段…\n✓ 已发送（HTTP 200）',
      },
    ]);
    const all = log.list({ limit: 1 });
    assert.equal(all.total, 2);
    assert.equal(all.items[0].textIncomplete, true);
    const comment = log.list({ type: 'comments', limit: 10 }).items[0];
    assert.equal(comment.text, '完整正文');
    assert.equal(comment.source, 'unknown');
    assert.ok(comment.link?.endsWith('#reply123'));
    assert.ok(!JSON.stringify(comment).includes('secret'));
    assert.equal(log.list({ offset: 1, limit: 1 }).items[0].id, comment.id);
    store.write('activities', [
      {
        id: 'rejected',
        at: '2026-01-03',
        action: 'reject',
        source: 'manual',
        state: 'success',
        channel: 'dm',
        summary: '拒绝草稿',
        text: '未发送',
      },
    ]);
    store.update('operations', [], (items) => {
      items.push({
        key: 'reply:live:12',
        channel: 'live',
        state: 'confirmed',
        at: '2026-01-04',
        text: '直播回复',
      });
      items.push({
        key: 'reply:dm:12:35',
        channel: 'dm',
        state: 'needs-review',
        at: '2026-01-05',
        text: '结果未确认',
      });
    });
    const sent = log.list({ type: 'sent:dm', limit: 1 });
    assert.equal(sent.total, 1, '发送记录分页前排除拒绝草稿和结果未确认的尝试');
    assert.equal(sent.items[0].text, '片段…');
    assert.equal(log.list({ type: 'sent:comments' }).items[0].id, comment.id);
    assert.equal(log.list({ type: 'live' }).items[0].text, '直播回复');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('真实工具路径在发送前保存全文；失败、草稿和审核发送各自留痕且没有重复发送', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-action-send-'));
  const store = new Store(dir);
  let fail = true,
    sends = 0;
  const text = '需要完整保存的回复。'.repeat(15);
  const service = new DragonService(store, async (args) => {
    if (args[0] === 'comment') {
      sends++;
      assert.equal(store.read('operations', []).at(-1)?.text, text);
      if (fail) throw Error('发送后连接中断');
    }
    return { code: 0, out: '发送成功', err: '' };
  });
  try {
    service.saveConfig({
      ...service.config(),
      owner: { mid: '1', name: '主人' },
      permissions: { ...service.config().permissions, comments: true },
    });
    for (const [id, mid] of [
      ['owner', '1'],
      ['other', '2'],
    ])
      service.ingest({
        id,
        mid,
        channel: 'comments',
        oid: '10',
        rpid: '20',
        business: 1,
        text: '原消息',
      });
    const tool = catalog(service, {
      activityContext: () => ({ source: 'autonomous', jobId: 'job' }),
    }).find((tool) => tool.name === 'dragon_reply')!;
    assert.equal((await tool.call({ eventId: 'owner', text })).isError, true);
    assert.equal(service.activity.list({ type: 'comments' }).items[0].state, 'unknown');
    await tool.call({ eventId: 'owner', text });
    assert.equal(sends, 1);
    await tool.call({ eventId: 'other', text });
    assert.equal(service.activity.list({ state: 'draft' }).items.length, 1);
    const draft = store.read('drafts', [])[0];
    fail = false;
    await service.activity.run('approve', { id: draft.id }, { source: 'manual' }, () =>
      service.approve(draft.id),
    );
    const sent = service.activity.list({ type: 'comments', state: 'success' }).items[0];
    assert.equal(sent.text, text);
    assert.equal(sent.targetMid, '2');
    assert.equal(sent.source, 'manual');
    assert.equal(sends, 2);
    assert.equal(store.read('operations', []).length, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('发送确认后记录尚未收尾就重启，按发送账本恢复结果，不重复展示', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-action-recover-'));
  const store = new Store(dir),
    log = new ActivityLog(store);
  try {
    store.write('activities', [
      {
        id: 'one',
        at: '2026-01-01',
        action: 'reply',
        source: 'manual',
        state: 'running',
        summary: '回复',
      },
    ]);
    store.write('operations', [
      {
        key: 'reply:one',
        at: '2026-01-01',
        channel: 'comments',
        state: 'confirmed',
        text: '已确认发送的正文',
        activityId: 'one',
      },
    ]);
    log.recover();
    const page = log.list();
    assert.equal(page.items.length, 1);
    assert.equal(page.items[0].state, 'success');
    assert.equal(page.items[0].text, '已确认发送的正文');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
