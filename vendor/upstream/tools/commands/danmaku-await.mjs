import {home as _dragonHome,runtime as _dragonRuntime,configFile as _dragonConfig} from '../../../../dist/runtime/vendor-paths.js';
import { guardedFetch as fetch } from '../lib/traffic.mjs'
// "叫我起床"式监听：只在出现**该回的弹幕**时退出，把消息交给 agent（我）去回。
// 与 danmaku-auto.mjs 的区别：它不发弹幕，只负责"发现 → 退出 → 让 agent 接手"。
//
//   node danmaku-await.mjs --room 999999004 --operator-uid 999999003 --anchor-uid 999999001 \
//        [--timeout 900] [--no-catchup]
//
// 退出时输出（供 agent 解析）：
//   AWAIT_HIT uid=.. uname=.. dmid=.. text=..
//   AWAIT_TIMEOUT  （在 timeout 秒内没有需要回复的弹幕）
//
// 状态文件 %USERPROFILE%\.bili-ai\await-state.json 记录最后处理时间，
// 启动时会用 gethistory 补一遍"我上任监听退出到这次启动之间"漏掉的弹幕。
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'

const argv = process.argv.slice(2)
const args = new Map()
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i]
  if (a.startsWith('--')) args.set(a.slice(2), argv[i + 1]?.startsWith('--') ? true : argv[++i] ?? true)
}
// 设置页的「直播间房间号」真的生效（2026-10-18 修）
const roomArg = String(args.get('room') ?? config().listen?.liveRoom ?? '')
// 2026-10-18 接线：设置页「直播间只回」= 只回主人 / 只回艾特她的
//   owner   → 自动只认主人 uid（config.owner.mid）
//   mention → 不加过滤，本文件本来也只认"@了她名字"的弹幕 ✓
const liveScope = String(args.get('scope') ?? config().listen?.liveScope ?? 'owner')
const operatorUid = Number(
  args.get('operator-uid')
  ?? (liveScope === 'owner' ? (config().owner?.mid ?? 0) : 0),
)
const anchorUid = Number(args.get('anchor-uid') ?? 0)
const timeoutSec = Number(args.get('timeout') ?? 900)
const noCatchup = args.has('no-catchup')
// 按人拉黑（逗号分隔）：机器人/复读账号别跟它对刷（比如某个总在刷同一句话的号）
const ignoreUids = String(args.get('ignore-uid') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map(Number)
// （自身昵称见下方 SELF_NAMES：会从 nav 动态读取，昵称改了也不会漏判）
if (!roomArg) { console.error('需要 --room <房间号>'); process.exit(2) }

const credDir = path.join((_dragonHome), '.bili-ai')
const dragonPending = path.join(credDir,'dragon-live-pending.json')
if(fs.existsSync(dragonPending)){console.log('DRAGON_LIVE_HIT '+fs.readFileSync(dragonPending,'utf8'));process.exit(0)}
const cred = JSON.parse(fs.readFileSync(path.join(credDir, 'credentials.json'), 'utf8'))
const statePath = path.join(credDir, 'await-state.json')
const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : { lastTs: 0 }
const recentIds = new Set(state.recentIds ?? []) // 已处理过的消息 id（跨进程持久，防止重挂后重复回）
const recentTexts = new Map(state.recentTexts ?? []) // "uid|文本" → 上次回复时间（防同句多发被回两次）
const saveState = (ts, extraId) => {
  if (extraId) recentIds.add(String(extraId))
  try {
    fs.writeFileSync(statePath, JSON.stringify({
      lastTs: ts, at: new Date().toISOString(),
      recentIds: [...recentIds].slice(-50),
      recentTexts: [...recentTexts].slice(-20),
    }))
  } catch {}
}

const cookieHeader = `SESSDATA=${cred.sessdata}; bili_jct=${cred.bili_jct}; buvid3=${cred.buvid3}`
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const H = () => ({ 'user-agent': UA, referer: `https://live.bilibili.com/${roomArg}`, origin: 'https://live.bilibili.com', cookie: cookieHeader })
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('zh-CN')}]`, ...a)
const jget = async (u) => (await fetch(u, { headers: H() })).json()

// 账号昵称可能被改（实测小号改过名），
// 所以自身名字动态从 nav 取，**历史昵称来自统一配置**（config.aliases），避免"@我"的弹幕被漏判。
import { config } from '../lib/config.mjs'
const SELF_NAMES = [...(config().aliases ?? [])]
try {
  const navNow = await jget('https://api.bilibili.com/x/web-interface/nav')
  const u = navNow.data?.uname
  if (u && !SELF_NAMES.includes(String(u))) SELF_NAMES.push(String(u))
  log(`自身账号: ${u ?? '?'} (mid ${navNow.data?.mid ?? '?'})  识别名: ${SELF_NAMES.join(' / ')}`)
} catch {}

// --seed：把"当前历史里的全部弹幕"标记为已处理，之后只回新消息。
// 用途：监听断过一段时间后重启，避免把积压的旧弹幕一条条当成新的来叫醒 agent
// （实测：重启后它会翻出 3 分钟前那句"回到十五年前的互联网"）。
if (args.has('seed')) {
  const info = await jget(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${roomArg}`)
  const h = await jget(`https://api.live.bilibili.com/xlive/web-room/v1/dM/gethistory?roomid=${info.data?.room_id ?? roomArg}&room_type=0`)
  let n = 0
  for (const r of h.data?.room ?? []) {
    const id = String(r.id_str ?? `${r.timeline}|${r.nickname}|${r.text}`)
    if (!recentIds.has(id)) { recentIds.add(id); n += 1 }
  }
  saveState(Date.now())
  console.log(`已把当前 ${n} 条历史弹幕标记为已处理（在册 ${recentIds.size} 条）；从现在起只回新消息`)
  process.exit(0)
}

// 主播账号下的"机器人/模板"句式：她与她的机器人**同账号**（uid 相同），只能靠句式区分。
// 下面每条都来自 2026-10-12 夜间实测原话；要改这张表，请顺手在 --selftest 的样例里同步增删。
const TEMPLATE = new RegExp([
  '^欢迎',          // 欢迎XX, 等你好久了~ / 欢迎XX, 什么星座的呀? / 你来啦~
  '喜欢主播',        // 喜欢主播的小伙伴，点点关注不迷路~ / 喜欢主播请关注, 主播带你去致富~
  // "求关注/点赞"这一族变体无穷（点点关注 / 点个关注行不行 / 万水千山总是情…），整族排除。
  // 宁可漏回一句真人，也不跟机器人对刷（真人重要的发言通常会带信息量，不会只说关注）。
  '关注|点赞',
  '支持主播',
  '小礼物',          // 小礼物和弹幕都是对主播的支持哦，比心心~
  '礼物',            // 感谢XX的礼物: 人气票x1
  '盲盒',            // 感谢XX的盲盒: 幸运盲盒x1(亏2.50元)
  // 她的自动致谢都以「感谢/谢谢」开头（礼物、盲盒、关注、夸奖…），按行首整族排除，别再逐条追
  '^感谢|^谢谢',
  '舰长',            // 舰长XX来给主播打call啦
  '打call',
  '比心心',
  '老板心意',        // 收到老板心意！😘 明天UV8安排…
  '谢谢你的贴心',     // 好哒～谢谢你的贴心建议呀🥰
  '^好哒',
  '夸我|宝宝的支持|谢谢宝宝',  // 夸我可太开心啦🎶，谢谢宝宝的支持！(ʃƪ＾∀＾)  ← 对夸奖的应答模板
  '收到.*科普|科普收到',  // 带内容摘要的 AI 应答框架（"收到！谢谢X的科普"这一类）
  // 她的 AI 应答常含「收到」（行首"收到老板心意！"、句中"碗主人的心意收到！"）→ 放宽到整句匹配
  '收到',
  '吃饱',            // 回声式应答（"哎呀，吃饱啦～"这一类）
  '感谢关注|谢谢关注',
  '笨蛋|天才',       // 与观众斗嘴的模板（"我才不是笨蛋呀！哼！"/"胡说！明明是天才！"）
  '有一种关心',
].join('|'))

function decide(uid, text, cfg = {}) {
  const opUid = cfg.operatorUid ?? operatorUid
  const anUid = cfg.anchorUid ?? anchorUid
  const ignored = (cfg.ignoreUids ?? ignoreUids).includes(uid)
  if (ignored) return { hit: false, why: '', reason: '在 --ignore-uid 黑名单里', templated: false }
  const mine = SELF_NAMES.some((n) => text.includes(`@${n}`))
  const fromOperator = !!opUid && uid === opUid
  const fromAnchor = !!anUid && uid === anUid
  const templated = TEMPLATE.test(text)
  let why = ''
  if (mine) why = '@了我'
  else if (fromOperator) why = '来自 operator'
  // 2026-10-12 主人要求：主播**非模板**的发言直接回（不再要求"像提问"）
  else if (fromAnchor && !templated) why = 'anchor 发言'
  const reason = why ? '' : (fromAnchor ? 'anchor 但属机器人模板句' : '非授权对象')
  return { hit: !!why, why, reason, templated }
}

// --selftest：用今晚实测原话回归测试过滤层（机器人句必须排除、真人发言必须命中）
if (args.has('selftest')) {
  const A = 999999001, O = 999999003
  const cases = [
    // —— 她（主播账号）的机器人模板句：必须【不】触发 ——
    [A, '欢迎y4ngyy, 等你好久了~', false],
    [A, '欢迎-筱阳阳-, 吃饭了嘛~', false],
    [A, '欢迎CuryMamo, 什么星座的呀?', false],
    [A, '欢迎我们的舰长—某舰长，想你啦~', false],
    [A, '欢迎欢迎～快乐老家开张啦！😆', false],
    [A, '喜欢主播的小伙伴，点点关注不迷路~', false],
    [A, '喜欢主播请关注, 主播带你去致富~', false],
    [A, '小礼物和弹幕都是对主播的支持哦，比心心~', false],
    [A, '感谢某观众3的礼物: 人气票x1', false],
    [A, '舰长某观众来给主播打call啦', false],
    [A, '收到老板心意！😘 明天UV8安排，保准亮瞎全场✨', false],
    [A, '好哒～谢谢你的贴心建议呀🥰', false],
    [A, '夸我可太开心啦🎶，谢谢宝宝的支持！(ʃƪ＾∀＾)', false],
    [A, '谢谢宝宝们的关注，比心~', false],
    [A, '万水千山总是情，点个关注行不行~', false],
    [A, '收到！谢谢你的科普～这个真有用😂', false],
    [A, '感谢某观众2的盲盒: 幸运盲盒x1(亏2.50元)', false],
    [A, '谢谢大家的关注，晚安啦~', false],
    [A, '收到设定啦~我记牢红线咯😘', false],
    [A, '哎呀，吃饱啦～收到你的心意！(≧▽≦)', false],
    [A, '我才不是笨蛋呀！(๑•̀ㅂ•́)و✧哼！', false],
    [A, '胡说！明明不是笨蛋嘛...(╯°□°）╯', false],
    // —— 她的真人发言：必须触发（非模板即回） ——
    [A, '明天需要穿外套吗', true],
    [A, '那需要防晒吗', true],
    [A, '偏头疼如何缓解', true],
    [A, '这个时候应该干点啥', true],
    [A, '你好你好', true],
    [A, '推荐一首歌', true],
    [A, '今天天气怎么样', true],
    // —— operator：无条件回 ——
    [O, '我要把她叫出来', true],
    [O, '主播，你好冷漠', true],
    [O, '哈哈哈', true],
    // —— 陌生观众 / @我：不搭理 / 必回 ——
    [520300843, '就是就是', false],
    [123, '路过看看', false],
  ]
  let bad = 0
  for (const [uid, text, expect] of cases) {
    const d = decide(uid, text, { operatorUid: O, anchorUid: A })
    const ok = d.hit === expect
    if (!ok) bad += 1
    console.log(`  ${ok ? '✓' : '✗ 期望不符'} ${d.hit ? `回（${d.why}）` : `忽略（${d.reason}）`}  「${text}」`)
  }
  console.log(bad ? `\n⚠ ${bad} 条与预期不符` : `\n过滤层 ${cases.length} 条样例全部符合预期`)
  process.exit(0)
}

const hitAndExit = (uid, uname, dmid, text, via) => {
  const event = {mid:String(uid),name:uname,dmid:String(dmid),text,via,room:roomArg,receipt:crypto.randomUUID()}
  fs.writeFileSync(dragonPending+'.tmp',JSON.stringify(event),{mode:0o600})
  fs.renameSync(dragonPending+'.tmp',dragonPending)
  saveState(Date.now(), dmid)
  console.log('DRAGON_LIVE_HIT '+JSON.stringify(event))
  console.log(`AWAIT_HIT uid=${uid} uname=${uname} dmid=${dmid} via=${via} text=${text}`)
  process.exit(0)
}

// ---- 统一的"扫一遍弹幕"：补漏与轮询共用，去重规则只有一处 ----
const SKY = 10 * 60 * 1000 // 时间只做粗筛（history 有可见延迟）；真去重靠 id 与 uid+文本
function scanRows(rows, via) {
  for (const r of [...rows].reverse()) {
    const id = String(r.id_str ?? `${r.timeline}|${r.nickname}|${r.text}`)
    // --debug：逐条说明"为什么跳过"（2026-10-18 排"看得见却不回"时加的 ✓）
    const dbg = (why) => { if (args.has('debug')) log(`[debug-scan] ${r.timeline} uid=${r.uid} 「${String(r.text).slice(0, 12)}」 → ${why}`) }
    if (recentIds.has(id)) { dbg('已见过（recentIds）'); continue }
    const ts = Date.parse(String(r.timeline).replace(/-/g, '/'))
    if (ts && Date.now() - ts > SKY) { dbg(`太旧（${Math.round((Date.now() - ts) / 60000)} 分钟 > 10）`); recentIds.add(id); continue }
    const textKey = `${r.uid}|${r.text}`
    const lastSame = recentTexts.get(textKey)
    // 2026-10-18 主人定：**监听到就回（实时）** ✓ —— 同文本只防 5 秒内重复（同一行已由 recentIds 挡 ✓）
    if (lastSame && Date.now() - lastSame < 5 * 1000) { dbg('同文5秒内已回'); recentIds.add(id); continue }
    const d = decide(Number(r.uid), String(r.text))
    dbg(d.hit ? `命中（${d.why}）` : `忽略（${d.reason}）`)
    recentIds.add(id)
    log(`${via} ${r.timeline} ${r.nickname}: ${r.text} → ${d.hit ? `需回复（${d.why}）` : '忽略'}`)
    if (d.hit) { recentTexts.set(textKey, Date.now()); hitAndExit(r.uid, r.nickname, id, r.text, `${via}:${d.why}`) }
  }
}

// ---- 启动补漏：用 gethistory 看看上一轮监听退出后有没有漏掉的 ----
if (!noCatchup) {
  try {
    const info = await jget(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${roomArg}`)
    const h = await jget(`https://api.live.bilibili.com/xlive/web-room/v1/dM/gethistory?roomid=${info.data?.room_id ?? roomArg}&room_type=0`)
    scanRows(h.data?.room ?? [], '补漏检查')
  } catch (e) { log(`补漏失败（不影响监听）: ${e.message}`) }
}

// ---- 实时监听 ----
const MIXIN_TAB = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52]
const keyOf = (u) => u.slice(u.lastIndexOf('/') + 1, u.lastIndexOf('.'))
const nav = await jget('https://api.bilibili.com/x/web-interface/nav')
const raw = keyOf(nav.data?.wbi_img?.img_url ?? '') + keyOf(nav.data?.wbi_img?.sub_url ?? '')
const mixin = MIXIN_TAB.map((i) => raw[i]).join('').slice(0, 32)
const wts = Math.round(Date.now() / 1000)
const clean = (v) => String(v).replace(/[!'()*]/g, '')
const qs = Object.keys({ id: roomArg, type: 0, wts }).sort().map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(clean(k === 'wts' ? wts : k === 'id' ? roomArg : 0))}`).join('&')
const dan = await jget(`https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo?${qs}&w_rid=${crypto.createHash('md5').update(qs + mixin).digest('hex')}`)
// 弹幕服务器列表只在 WebSocket 模式下需要（见下方 ws 分支）；轮询模式不连 ws

log(`等待中（房间 ${roomArg}，最多 ${timeoutSec}s；只等 operator=${operatorUid} / anchor=${anchorUid} / @${SELF_NAMES.join(' 或 @')}）`)
let frames = 0
let dm = 0
const enc = new TextEncoder()
const mk = (op, str) => {
  const b = enc.encode(str); const u = new Uint8Array(16 + b.length); const dv = new DataView(u.buffer)
  dv.setUint32(0, 16 + b.length); dv.setUint16(4, 16); dv.setUint16(6, 1); dv.setUint32(8, op); dv.setUint32(12, 1)
  u.set(b, 16); return u
}
function handle(buf) {
  let off = 0
  while (off + 16 <= buf.length) {
    const total = buf.readUInt32BE(off)
    if (total < 16 || off + total > buf.length) break
    const hlen = buf.readUInt16BE(off + 4)
    const ver = buf.readUInt16BE(off + 6)
    const op = buf.readUInt32BE(off + 8)
    const body = buf.subarray(off + hlen, off + total)
    if (ver === 3 || ver === 2) { try { handle(ver === 3 ? zlib.brotliDecompressSync(body) : zlib.inflateSync(body)) } catch {} }
    else if (op === 5) {
      try {
        const o = JSON.parse(body.toString('utf8'))
        if (String(o.cmd ?? '').startsWith('DANMU_MSG')) {
          const i = o.info ?? []
          const uid = Number(i[2]?.[0] ?? 0)
          const uname = String(i[2]?.[1] ?? '')
          const text = String(i[1] ?? '')
          const dmid = i[0]?.[5] ?? ''
          const d = decide(uid, text)
          dm += 1
          log(`看到 ${uname}(uid ${uid}): ${text} → ${d.hit ? `需回复（${d.why}）` : '忽略'}`)
          if (d.hit) hitAndExit(uid, uname, dmid, text, d.why)
        }
      } catch {}
    }
    off += total
  }
}
// ---- 唤醒机制 ----
// 默认走轮询 gethistory：慢一点（≤interval 秒）但**可靠**——WebSocket 那条路实测会
// 连接即断（单连接诊断正常，是我这边的重连循环有问题），因此降级为可选。
const watchMode = String(args.get('watch') ?? 'poll')
const intervalMs = Math.max(30, Number(args.get('interval')) || 60) * 1000
const deadline = Date.now() + timeoutSec * 1000

if (watchMode === 'poll') {
  log(`轮询模式：每 ${intervalMs / 1000}s 查一次 gethistory，最多 ${timeoutSec}s`)
  let polls = 0
  const info = await jget(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${roomArg}`)
  if (info.code !== 0) { console.error('直播间信息不可用，本次停止监听'); process.exit(3) }
  const resolvedRoom = info.data?.room_id ?? roomArg
  let lastHistory = '', idleRounds = 0
  let lastBeat = Date.now()
  const SKY_UNUSED = 0
  while (Date.now() < deadline) {
    polls += 1
    try {
      const h = await jget(`https://api.live.bilibili.com/xlive/web-room/v1/dM/gethistory?roomid=${resolvedRoom}&room_type=0`)
      if (h.code !== 0) { console.error(`弹幕读取失败 code=${h.code}，停止本轮监听`); process.exit(3) }
      const history = JSON.stringify(h.data?.room ?? [])
      idleRounds = history === lastHistory ? idleRounds+1 : 0
      lastHistory = history
      // --debug：把这一轮拿到的行原样打出来（排"为什么没认出主人"用 ✓ 不打印凭据 ✗）
      if (args.has('debug')) {
        const rows = h.data?.room ?? []
        log(`[debug] code=${h.code} 行数=${rows.length} operator=${operatorUid} anchor=${anchorUid}`)
        for (const r of rows.slice(-4)) log(`[debug]   ${r.timeline} uid=${r.uid}(${typeof r.uid}) ${r.nickname}: ${r.text}`)
      }
      scanRows(h.data?.room ?? [], '轮询发现')
      if (Date.now() - lastBeat > 60000) { lastBeat = Date.now(); log(`心跳：已轮询 ${polls} 次，暂无需要回复的弹幕`) }
    } catch (e) { log(`轮询暂停: ${e.message}`); process.exit(3) }
    await new Promise((r) => setTimeout(r, Math.max(0,Math.min(deadline-Date.now(),Math.max(intervalMs,300000), intervalMs*2**Math.min(idleRounds,5)))))
  }
  saveState(Date.now())
  console.log(`AWAIT_TIMEOUT  轮询 ${polls} 次，${timeoutSec}s 内没有需要回复的弹幕`)
  process.exit(0)
}

// ---- 可选：WebSocket 模式（实验性，带退避与熔断，避免连接风暴）----
const hosts = dan.data?.host_list ?? []
if (!hosts.length) { console.error('取不到弹幕服务器'); process.exit(6) }
let hostIdx = 0
let attempts = 0
let consecutiveDead = 0
log(`WebSocket 模式：候选节点 ${hosts.length} 个`)
const beat = setInterval(() => log(`心跳：已收 ${frames} 帧 / ${dm} 条弹幕（节点 ${hosts[hostIdx % hosts.length]?.host}）`), 60000)

async function listenOnce(host, ms) {
  const before = frames
  await new Promise((resolve) => {
    let settled = false
    let hb = null
    let t = null
    const done = () => { if (settled) return; settled = true; if (hb) clearInterval(hb); if (t) clearTimeout(t); try { ws.close() } catch {} ; resolve() }
    const ws = new WebSocket(`wss://${host.host}:${host.wss_port}/sub`)
    try { ws.binaryType = 'arraybuffer' } catch {}
    hb = setInterval(() => { try { ws.send(mk(2, '[object Object]')) } catch {} }, 30000)
    t = setTimeout(done, ms)
    ws.addEventListener('open', () => {
      attempts += 1
      ws.send(mk(7, JSON.stringify({ uid: nav.data?.mid ?? 0, roomid: roomArg, protover: 3, platform: 'web', type: 2, key: dan.data.token })))
    })
    ws.addEventListener('message', async (ev) => {
      frames += 1
      try {
        const ab = ev.data instanceof ArrayBuffer ? ev.data : await ev.data?.arrayBuffer?.()
        if (ab) handle(Buffer.from(ab))
      } catch {}
    })
    ws.addEventListener('error', () => {})
    ws.addEventListener('close', (e) => { if (!settled) log(`连接关闭 code=${e.code ?? '-'}（已收 ${frames - before} 帧）`); done() })
  })
  return frames > before
}

while (Date.now() < deadline) {
  const host = hosts[hostIdx % hosts.length]
  const alive = await listenOnce(host, Math.min(25000, deadline - Date.now()))
  if (alive) {
    consecutiveDead = 0
    log(`节点 ${host.host} 正常（累计 ${frames} 帧），继续用它`)
  } else {
    consecutiveDead += 1
    hostIdx += 1
    if (consecutiveDead >= 8) {
      clearInterval(beat)
      saveState(Date.now())
      console.log(`AWAIT_DEAD  连续 ${consecutiveDead} 次连接都拿不到数据（${attempts} 次尝试），停止以免连接风暴`)
      process.exit(0)
    }
    await new Promise((r) => setTimeout(r, Math.min(1000 * consecutiveDead, 8000))) // 退避
  }
}
clearInterval(beat)
saveState(Date.now())
console.log(`AWAIT_TIMEOUT  ${timeoutSec}s 内没有需要回复的弹幕（期间 ${frames} 帧 / ${dm} 条弹幕 / ${attempts} 次连接）`)
process.exit(0)
