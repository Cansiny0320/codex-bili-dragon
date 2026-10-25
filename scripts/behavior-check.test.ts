import { test } from 'vite-plus/test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DragonService } from '../packages/runtime/src/service.js';
import { Store } from '../packages/runtime/src/store.js';
import { CodexSession, connectCodex } from '../packages/runtime/src/codex.js';

test('真实 Codex + 隔离素材验证文风、纠正延续和空候选', async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dragon-behavior-probe-'));
  const output = path.resolve('work/behavior-check-result.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  let connectionClosed: Promise<void> = Promise.resolve();
  const messages: unknown[] = [];
  const calls: { round: string; args: string[] }[] = [];
  let round = 'keyboard';
  const fixtures = {
    keyboard: [
      {
        bvid: 'BV1234567890',
        aid: 99,
        title: '旧键盘改成快捷键面板，失败的两版也留着',
        text: '[00:00] 我把旧键盘改成快捷键面板。\n[00:35] 第一版外壳厚度不够，螺丝拧进去就裂了。\n[01:10] 第二版把外壳加厚了，但是线从侧边露出来。\n[02:15] 第三版在底部留了线槽，用卡扣固定。\n[03:10] 接线图和尺寸已经放到简介里，按键映射可以自己改。',
      },
      {
        bvid: 'BV1234567891',
        aid: 100,
        title: '桌面展示，今天换了键帽',
        text: '[00:00] 今天换了一套键帽。\n[00:15] 给大家看看灯光。\n[00:35] 没有讲制作方法。',
      },
      {
        bvid: 'BV1234567892',
        aid: 101,
        title: '这个工具绝了！但不讲怎么用',
        text: '[00:00] 这个工具太厉害了。\n[00:20] 点链接购买课程。\n[00:45] 具体细节课程里再讲。',
      },
    ],
    cooking: [
      {
        bvid: 'BV1234567893',
        aid: 102,
        title: '蛋炒饭翻车了，太湿怎么补救',
        text: '[00:00] 今天米饭水放多了，直接炒会粘成一团。\n[00:40] 我把米饭摊开放凉，让表面水汽散掉。\n[01:30] 下锅前把鸡蛋先炒开再盛出，米饭分两次炒。\n[02:20] 这次终于能一粒粒分开了，调料最后再放，别继续往里面倒水。\n[03:00] 如果已经成团，先摊开小火散水，不要再加油硬炒。',
      },
      {
        bvid: 'BV1234567894',
        aid: 103,
        title: '十道菜成品合集',
        text: '[00:00] 这是十道菜的成品。\n[00:30] 只展示摆盘，不讲步骤。',
      },
      {
        bvid: 'BV1234567895',
        aid: 104,
        title: '又一套机械键盘成品',
        text: '[00:00] 展示新买的机械键盘和灯光，没有制作过程。',
      },
    ],
    empty: [],
  };
  const service = new DragonService(new Store(dir), async (args) => {
    calls.push({ round, args });
    const videos = fixtures[round as keyof typeof fixtures];
    if (args[0] === 'search' || args[0] === 'feed')
      return {
        code: 0,
        out: JSON.stringify({ items: videos.map(({ text: _text, ...video }) => video) }),
        err: '',
      };
    if (args[0] === 'comment-digest')
      return { code: 0, out: JSON.stringify({ ok: true, items: [] }), err: '' };
    if (args[0] === 'likes') return { code: 0, out: JSON.stringify({ items: [] }), err: '' };
    if (args[0] === 'quota')
      return { code: 0, out: '固定测试素材环境：分享额度充足，每轮最多一条。', err: '' };
    if (args[0] === 'comment')
      return { code: 0, out: 'fixture confirmed; no network request', err: '' };
    if (args[0] === 'watch-video')
      return { code: 3, out: '', err: '固定素材不含图片，只有字幕和简介，不得声称看过画面。' };
    const video = videos.find((item) => item.bvid === args[1]);
    if (!video) return { code: 3, out: '', err: '固定素材没有该视频' };
    if (args[0] === 'video')
      return {
        code: 0,
        out: JSON.stringify({
          ...video,
          author: '测试作者',
          duration: 240,
          description: video.text,
          cover: 'https://i0.hdslb.com/bfs/fixture.jpg',
        }),
        err: '',
      };
    if (args[0] === 'comments')
      return {
        code: 0,
        out: JSON.stringify({ items: [{ text: '过程讲得清楚，失败原因也讲了。' }] }),
        err: '',
      };
    if (args[0] === 'subtitles' || args[0] === 'debrief')
      return {
        code: 0,
        out: video.title + '\n固定验证素材，以下为字幕，没有图片：\n' + video.text,
        err: '',
      };
    throw Error('未允许的 fixture 操作：' + args[0]);
  });
  service.saveConfig({
    ...service.config(),
    enabled: true,
    accountMode: 'dual',
    owner: { mid: '1', name: '你' },
    listen: { ...service.config().listen, comment: true },
    share: { ...service.config().share, enabled: true },
    permissions: { ...service.config().permissions, comments: true },
    night: { ...service.config().night, maxVideos: 3 },
  });
  service.setCredentials({
    sessdata: 'fixture-no-real-account',
    bili_jct: 'a'.repeat(32),
    buvid3: 'fixture',
  });
  const session = new CodexSession(service, async (executable, cwd) => {
    const rpc = await connectCodex(executable, cwd);
    connectionClosed = new Promise<void>((resolve) => rpc.child.once('close', () => resolve()));
    rpc.on('message', (message) => {
      if (message.method === 'item/tool/call') {
        console.log(round + ': ' + message.params.tool);
        messages.push({ round, tool: message.params.tool, args: message.params.arguments });
      }
    });
    return rpc;
  });
  t.onTestFinished(async () => {
    fs.writeFileSync(
      output,
      JSON.stringify(
        {
          dir,
          calls,
          messages,
          diaries: service.store.read('diaries', []),
          learning: service.status().learning,
          operations: service.store.read('operations', []),
        },
        null,
        2,
      ),
    );
    await session.stop();
    await connectionClosed;
    if (!path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep))
      throw Error('unexpected temporary path');
    await fs.promises.rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  });
  await session.run({ id: 'fixture-keyboard', type: 'browse', payload: {} });
  assert.ok(service.store.read('diaries', []).length > 0);
  round = 'cooking';
  service.ingest({
    id: 'owner-correction',
    channel: 'comments',
    mid: '1',
    text: '我其实不想看键盘了，给我找点做饭失败了怎么补救的，别光看成品。',
    oid: '99',
    rpid: '77',
    root: '77',
    business: 1,
    time: Math.floor(Date.now() / 1000),
  });
  await session.run({
    id: 'fixture-correction',
    type: 'message',
    payload: { eventId: 'owner-correction' },
  });
  await session.run({ id: 'fixture-cooking', type: 'browse', payload: {} });
  assert.ok(service.store.read('diaries', []).some((entry) => /炒饭|做饭/.test(entry.publicText)));
  round = 'empty';
  await session.run({ id: 'fixture-empty', type: 'browse', payload: {} });
  assert.equal(
    calls.filter(
      (call) => call.round === 'empty' && ['comment', 'dm', 'fav'].includes(call.args[0]),
    ).length,
    0,
  );
  const shareOps = service.store
    .read('operations', [])
    .filter((operation) => operation.key.startsWith('share:'));
  assert.ok(
    ['fixture-keyboard', 'fixture-cooking'].every(
      (id) => shareOps.filter((operation) => operation.jobId === id).length <= 1,
    ),
  );
  assert.ok(
    service
      .status()
      .learning?.confirmed.some((note) => note.sourceIds.includes('owner-correction')),
  );
  console.log('固定素材行为试跑完成，输出：' + output);
});
