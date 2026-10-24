import {home as _dragonHome,runtime as _dragonRuntime,configFile as _dragonConfig} from '../../../../src/vendor-paths.mjs';
import { guardedFetch as fetch } from '../lib/traffic.mjs'
// 选题器：照"她自己的偏好"挑今天该看什么。**只读**，不产生任何对外动作。
//
// 用法: node feed.mjs [--n 6] [--per 2] [--pool 30]
// 数据来源：~/.dsh/whale-diary.md 的「爱看」一行（偏好关键词）+「看过的」表格（防重复）
//          + commented-videos.md（已评论过的视频也排除）
//
// 为什么这么做（2026-10-14 主人定的方向）：主人要的是"有日子的鱼"，
// 所以"看什么"不该由别人喂，而该由她自己的偏好决定 —— 偏好写在日记里，这个脚本只负责照它去捞。
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../lib/config.mjs'
import crypto from 'node:crypto'
import { dshPath } from '../lib/paths.mjs'


const argv = process.argv.slice(2)
const opt = {}
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') ? true : argv[++i] ?? true
}
const N = Number(opt.n ?? 6)
const PER = Number(opt.per ?? 2)
// 2026-10-22 调（主人问「feed 是不是筛得太严」）：不是严 ✗ 是池子太小 ✗
//   实测同一时刻：pool=30 → 只出 3 条且全是碎屑 ✗
//                 pool=60 → 出满 5 条，两条 DSH/AI 相关 + 两条猫咪 + 一条大肥鱼 ✓
//   代价：每个关键词多抓几条（搜索请求数不变 ✓ 只是每页多取几条 ✓）
const POOL = Number(opt.pool ?? 60)

const HOME = (_dragonHome)
const diary = dshPath('whale-diary.md')
// 2026-10-18：审计表挪到 `~/.bili-ai/` ✓（原来写死作者机器路径 ✗ 换机器就写不进去，静默失效 ✗）
const audit = path.join(HOME, '.bili-ai', 'commented-videos.md')

// ── 偏好与"看过"名单：都从日记里读 ──
let prefs = [...(config().preferences?.like ?? [])]   // 偏好来自统一配置（首选）
let dislike = [...(config().preferences?.dislike ?? [])]
let seen = new Set()
try {
  const text = fs.readFileSync(diary, 'utf8')
  const m = text.match(/^-\s*\*\*爱看\*\*：(.+)$/m)
  // 兼容旧写法：日记里若仍写着「爱看」，只在配置没给偏好时兜底（日记应回归纯叙事）
  if (m && !prefs.length) prefs = m[1].split(/[·、,，]/).map((s) => s.trim()).filter(Boolean)
  for (const bv of text.matchAll(/\bBV[0-9A-Za-z]{10}\b/g)) seen.add(bv[0])
} catch { console.log('（读不到日记，用默认偏好）') }
try {
  for (const bv of fs.readFileSync(audit, 'utf8').matchAll(/\bBV[0-9A-Za-z]{10}\b/g)) seen.add(bv[0])
} catch { /* 没有审计表也无妨 */ }

const cred = JSON.parse(fs.readFileSync(path.join(HOME, '.bili-ai', 'credentials.json'), 'utf8'))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const H = { 'user-agent': UA, referer: 'https://search.bilibili.com/', cookie: `SESSDATA=${cred.sessdata}; bili_jct=${cred.bili_jct}; buvid3=${cred.buvid3}` }
const MIXIN_TAB = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52]
const keyOf = (u) => u.slice(u.lastIndexOf('/') + 1, u.lastIndexOf('.'))
const nav = await (await fetch('https://api.bilibili.com/x/web-interface/nav', { headers: H })).json()
const mixin = MIXIN_TAB.map((i) => (keyOf(nav.data?.wbi_img?.img_url ?? '') + keyOf(nav.data?.wbi_img?.sub_url ?? ''))[i]).join('').slice(0, 32)
const wbi = (p) => {
  const wts = Math.round(Date.now() / 1000)
  const q = Object.keys({ ...p, wts }).sort().map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String(k === 'wts' ? wts : p[k]).replace(/[!'()*]/g, ''))}`).join('&')
  return `${q}&w_rid=${crypto.createHash('md5').update(q + mixin).digest('hex')}`
}
const secs = (s) => { const p = String(s).split(':').map(Number); return p.length === 2 ? p[0] * 60 + p[1] : p[0] * 3600 + p[1] * 60 + p[2] }

// 2026-10-22：搜索关键词也要用切出来的短词 ✗ 不能拿「鬼畜与怀旧向剪辑」整句去搜（搜不出东西 ✗）
//   规则：每个偏好取一个最能搜到东西的词 —— 有分段就取第一段（鬼畜 ✓ / 怀旧 ✓），
//        整句没有连接词可切的（如「B站生态八卦」）就取中文双字（八卦 ✓）
const JOIN_WORDS = /[\s·,，、/]+|与|和|及|向|的|类/
function partsOf(p) {
  return [...new Set(String(p).split(JOIN_WORDS).map((x) => x.trim()).filter((x) => x.length >= 2))]
}
function searchKeywordOf(p) {
  const parts = partsOf(p)
  // 只有切出【多个】短段才算真切开 ✓
  // 「B站生态八卦」切完还是一整块 ✗ 那就不能拿整句去搜（搜不出东西 ✗）
  if (parts.length > 1) return parts[0]
  if (parts.length === 1 && parts[0].length < 4) return parts[0]
  const grams = []
  const all = String(p)
  for (let i = 0; i + 2 <= all.length; i += 1) {
    const bg = all.slice(i, i + 2)
    if (/^[\u4e00-\u9fa5]{2}$/.test(bg)) grams.push(bg)
  }
  return grams[grams.length - 1] ?? String(p)
}
const searchKeywords = [...new Set(prefs.slice(0, 6).map(searchKeywordOf))]

// 2026-10-23 改（主人：feed 27 秒太久 ✗）：
//   以前 6 个词 × 2 种排序 = 12 次搜索 ✗ 加上请求保护层的 1500ms → 18 秒 ✗
//   现在每个词只搜一种排序，按词交替 click / pubdate ✓ → 6 次 ✓
//   （两种排序都还覆盖着 ✓ 只是每个词只取一种 ✓ 池子小一点但候选够了 ✓）
// 2026-10-23：搜索结果按「关键词+排序」缓存 10 分钟 ✓
//   动机：一晚她可能跑两次 feed ✗ 第二次完全一样 ✓ 没必要再打 6 次请求 ✓
//   10 分钟够短，不会让她一直看同一批东西 ✓
const SEARCH_CACHE = path.join(_dragonHome, '.bili-ai', 'feed-search-cache.json')
const SEARCH_TTL_MS = 10 * 60 * 1000
async function searchCached(kw, order) {
  const key = kw + '|' + order
  let store = {}
  try { store = JSON.parse(fs.readFileSync(SEARCH_CACHE, 'utf8')) } catch {}
  const hit = store[key]
  if (hit && Date.now() - Number(hit.at ?? 0) < SEARCH_TTL_MS) return hit.data
  const j = await (await fetch(`https://api.bilibili.com/x/web-interface/wbi/search/type?${wbi({ search_type: 'video', keyword: kw, order, page: 1 })}`, { headers: H })).json()
  if (j && j.code === 0) {
    store[key] = { at: Date.now(), data: j }
    // 只留最近 40 条，别无限长 ✓
    const keys = Object.keys(store)
    if (keys.length > 40) { keys.sort((a,b) => (store[a].at??0) - (store[b].at??0)); for (const k of keys.slice(0, keys.length - 40)) delete store[k] }
    try { fs.writeFileSync(SEARCH_CACHE, JSON.stringify(store)) } catch {}
  }
  return j
}
const pool = []
for (const [kwIndex, kw] of searchKeywords.entries()) {
  for (const order of [kwIndex % 2 === 0 ? 'click' : 'pubdate']) {
    try {
      const j = await searchCached(kw, order)
      for (const it of (j?.data?.result ?? []).slice(0, Math.ceil(POOL / Math.max(1, searchKeywords.length)) + 4)) {
        pool.push({
          bv: it.bvid, t: String(it.title).replace(/<[^>]+>/g, ''), d: secs(it.duration),
          dm: Number(it.danmaku ?? 0), play: Number(it.play ?? 0), up: it.author, kw,
        })
      }
    } catch { /* 这个词没结果就跳过 */ }
    await new Promise((r) => setTimeout(r, 300))
  }
}

// ── #3 更多来源（2026-10-18 加，Kimi 评审指出：只搜关键词 = 只刷"搜索"，不是刷 B 站）
//   --source search（默认）| popular（热门）| rank（排行榜）| all（三个都要）
const SOURCE_HOT = String((process.argv.find((a) => a.startsWith('--source=')) ?? '').split('=')[1] ?? '')
  || (process.argv.includes('--source') ? String(process.argv[process.argv.indexOf('--source') + 1] ?? 'all') : 'all')
async function fetchPopular() {
  const j = await (await fetch('https://api.bilibili.com/x/web-interface/popular?pn=1&ps=20', { headers: H })).json()
  for (const it of (j?.data?.list ?? [])) {
    pool.push({ bv: it.bvid, t: String(it.title ?? '').replace(/<[^>]+>/g, ''), d: Number(it.duration ?? 0),
      dm: Number(it.stat?.danmaku ?? 0), play: Number(it.stat?.view ?? 0), up: it.owner?.name ?? '', kw: '热门' })
  }
}
async function fetchRank() {
  const j = await (await fetch('https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all', { headers: H })).json()
  for (const it of (j?.data?.list ?? []).slice(0, 20)) {
    pool.push({ bv: it.bvid, t: String(it.title ?? '').replace(/<[^>]+>/g, ''), d: Number(it.duration ?? 0),
      dm: Number(it.stat?.danmaku ?? 0), play: Number(it.stat?.view ?? 0), up: it.owner?.name ?? '', kw: '排行' })
  }
}
// 关注的人发了什么（2026-10-18 加）：真人才会"刷关注"——只搜关键词等于只刷"搜索"，不像人
async function fetchFollowing() {
  const j = await (await fetch('https://api.bilibili.com/x/polymer/web-dynamic/v1/feed/all?type=video&page=1', { headers: H })).json()
  if (j?.code !== 0) throw new Error(`code=${j?.code} ${j?.message ?? ''}`)
  for (const it of (j?.data?.items ?? [])) {
    const a = it?.modules?.module_author
    const ar = it?.modules?.module_dynamic?.major?.archive
    if (!ar?.bvid) continue
    const dt = String(ar.duration_text ?? '')          // 形如 "05:23"
    const p = dt.split(':').map(Number)
    const secs = p.length === 2 ? p[0] * 60 + p[1] : p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : 0
    pool.push({ bv: ar.bvid, t: String(ar.title ?? '').replace(/<[^>]+>/g, ''), d: secs,
      dm: 0, play: Number(ar.stat?.play ?? 0), up: a?.name ?? '', kw: '关注' })
  }
}
try { if (SOURCE_HOT === 'popular' || SOURCE_HOT === 'all') await fetchPopular() } catch { console.error('（热门源取不到，跳过）') }
try { if (SOURCE_HOT === 'rank' || SOURCE_HOT === 'all') await fetchRank() } catch { console.error('（排行源取不到，跳过）') }
try { if (SOURCE_HOT === 'following' || SOURCE_HOT === 'all') await fetchFollowing() } catch (e) { console.error(`（关注源取不到，跳过：${String(e.message).slice(0, 60)}）`) }
console.error(`[来源] ${SOURCE_HOT === 'all' ? '搜索 + 热门 + 排行 + 关注' : SOURCE_HOT === 'popular' ? '热门' : SOURCE_HOT === 'rank' ? '排行' : SOURCE_HOT === 'following' ? '关注' : '搜索'}`)

// ── 反馈回流（2026-10-20 加，主人定：B 也做）────────────────────────────
//   feedback.json 里 kind='like' 的事件带 videoTitle → 对被赞视频【标题相似】的候选加权
//   相似度用字符二元组 Jaccard（中文不用分词也能用 ✓）
const FEEDBACK = path.join(HOME, '.bili-ai', 'feedback.json')
let likedEvents = []
try {
  const fb = JSON.parse(fs.readFileSync(FEEDBACK, 'utf8'))
  likedEvents = (fb.events ?? [])
    .filter((e) => e && (e.kind === 'like' || (typeof e.note === 'string' && /BV[0-9A-Za-z]{10}/.test(e.note))))
    .filter((e) => String(e.videoTitle ?? '').trim())   // 没有标题的旧事件学不到东西，跳过 ✓
} catch { /* 没有反馈就零加权 */ }
const favBVs = new Set()
try {
  const fj = JSON.parse(fs.readFileSync(path.join(HOME, '.bili-ai', 'favorites.json'), 'utf8'))
  for (const x of (fj.items ?? [])) if (x?.bv) favBVs.add(x.bv)
} catch {}
const likedBVs = new Set()
try {
  const fb = JSON.parse(fs.readFileSync(FEEDBACK, 'utf8'))
  for (const e of (fb.events ?? [])) if (e?.bv) likedBVs.add(e.bv)
} catch {}
  // 抽主题词：拉丁词（≥2）+ 中文 3-4 字 n-gram（更具体，避免"我为/添加"这类噪音）
  // 为什么不比标题相似度（Jaccard）：实测"几乎改一个字"的两条标题相似度只有 0.036 ✗
  //   主题词方案能学到"dsh""大肥鱼"这种真正跨标题复用的信号 ✓
  const STOP_WORDS = new Set(['我为', '添加', '开屏', '广告', '这个', '那个', '什么', '自己', '可以', '就是', '一个'])
  const ownerName = String(config().owner?.name ?? '')
  const learnTokens = (text) => {
    const out = new Set()
    // ⚠️ ownerName 为空时 new RegExp('') 会在每个字之间插空格 → 必须先判断 ✗（实测踩过）
    const base = ownerName ? String(text).replace(new RegExp(ownerName, 'g'), ' ') : String(text)
    const t = base.replace(/@\S+/g, ' ')
    for (const m of t.matchAll(/[A-Za-z][A-Za-z0-9]{1,}/g)) if (m[0].length >= 2) out.add(m[0].toLowerCase())
    for (const m of t.matchAll(/[\u4e00-\u9fa5]{2,}/g)) {
      const run = m[0]
      for (const n of [3, 4]) for (let i = 0; i + n <= run.length; i += 1) {
        const g = run.slice(i, i + n)
        if (!STOP_WORDS.has(g)) out.add(g)
      }
    }
    return [...out]
  }
  // 她自己收藏过的（favorites.json）也算"品味信号" ✓ 和"被赞过的"并列
  let favItems = []
  try {
    const fj = JSON.parse(fs.readFileSync(path.join(HOME, '.bili-ai', 'favorites.json'), 'utf8'))
    favItems = (fj.items ?? []).filter((x) => x && x.bv)
  } catch {}
  const learnedTokens = [...new Set([
    ...likedEvents.flatMap((e) => learnTokens(String(e.videoTitle ?? '') + ' ' + String(e.comment ?? ''))),
    ...favItems.flatMap((x) => learnTokens(String(x.title ?? '') + ' ' + String(x.reason ?? ''))),
  ])]
  const learnedHitsOf = (title) => learnedTokens.filter((tok) => title.toLowerCase().includes(tok)).length
  // 每条命中 +2.5，最多 +7.5（不压过偏好命中的主权重 ✓）
  const boostOf = (title) => Math.min(7.5, learnedHitsOf(title) * 2.5)

// ── 偏好命中与排序（2026-10-20 重写，主人定：不要对高播放量有偏向 ✗）────────────
//   旧：弹幕密度 + log10(播放)×3  → 大 UP 的爆款永远霸榜 ✗
//   新：log10(1+弹幕密度)×3 + 偏好命中×4 + 反馈学习×2.5（封顶 7.5）→ 播放量彻底移出 ✓
//   为什么密度要取 log：不取时"92 秒 15027 弹幕"那条得 163 分，偏好加满也压不过 ✗（实测）
// 2026-10-22 修（主人发现「鬼畜」「B站生态八卦」从来命中不了）：
//   旧切法只认 空格/顿号/斜杠 → 「鬼畜与怀旧向剪辑」切不开 ✗ 变成 8 字长 token
//   → 标题里必须原样出现这 8 个字 → 永远不命中 ✗
//   新切法两步：
//     ① 按分隔符 + 连接词（与 和 及 向 的 类）切开 → 鬼畜 / 怀旧 / 剪辑 ✓
//     ② 切完还 ≥4 字的长块（如「B站生态八卦」）→ 补 2 字滑动窗 → B站 / 八卦 ✓
//   ⚠️ 滑动窗只用于【命中判断】✓ 搜索关键词只用 ① 的词（搜「态八」是垃圾 ✗）
function tokensOf(p) {
  const parts = partsOf(p)
  const extra = []
  for (const part of parts) {
    if (part.length < 4) continue
    for (let i = 0; i + 2 <= part.length; i += 1) {
      const bg = part.slice(i, i + 2)
      if (/^[\u4e00-\u9fa5]{2}$/.test(bg)) extra.push(bg)   // 只收纯中文双字（否则 Live2D 会切出 Li/iv 这种垃圾 ✗）
    }
  }
  return [...new Set([String(p), ...parts, ...extra])]
}

const prefTokens = prefs.map((p) => ({
  label: p,
  tokens: tokensOf(p),   // 2026-10-22：长标签也能切碎 ✓
}))
const hitsOf = (title) => prefTokens.filter((p) => p.tokens.some((tok) => title.includes(tok))).map((p) => p.label)
const densityOf = (x) => Math.log10(1 + x.dm / Math.max(30, x.d))
// 2026-10-20：排除她自己的视频（实测刷到过自己的《大肥鱼成精了》✗ 别让自己看自己）
const selfName = String(config().self?.name ?? "")
// 2026-10-22 加（主人问「feed 是不是筛得太严」）：不是严 ✗ 是【没有质量下限】✗
//   实测：候选池 66 条 → 只出 3 条，其中 2 条是 0/1 播放的碎屑 ✓
//   注意：这不是给播放量加权 ✗（那条是主人 10-20 明确否掉的）
//   只是丢掉「几乎无人看过」的：播放<300 且 弹幕<3，且不是多偏好命中 ✓
const looksLikeJunk = (x) => x.play < 300 && x.dm < 3
const uniq = [...new Map(pool.map((x) => [x.bv, x])).values()]
  .filter((x) => !seen.has(x.bv) && !likedBVs.has(x.bv) && !favBVs.has(x.bv))
  .filter((x) => !(selfName && String(x.up ?? "").includes(selfName)))
  // 2026-10-22：碎屑丢掉落（多偏好命中 ≥2 的留着 ✓ 那可能真是小众宝藏）
  .filter((x) => !looksLikeJunk(x) || hitsOf(x.t).length >= 2)
const scoreOf = (x) => densityOf(x) * 3 + hitsOf(x.t).length * 4 + boostOf(x.t)
uniq.sort((a, b) => scoreOf(b) - scoreOf(a))
for (const x of uniq) { x._hits = hitsOf(x.t); x._score = scoreOf(x) }

// 多样性：同一"命中和类"最多 PER 条；完全没命中的最多 1 条（防凑数 ✗）
const kindUsed = {}
const diversified = []
for (const x of uniq) {
  const key = x._hits.length ? x._hits.join('+') : '__none__'
  kindUsed[key] = kindUsed[key] ?? 0
  // 2026-10-22：以前「完全没命中偏好的」只留 1 条 ✗
//   实测：66 条候选里绝大多数标题不含偏好词 → 全落进 __none__ → 只放 1 条出来 ✗
//   → 候选池 66 条却只给 3 条 ✓ 现在放到 3 条（配合上面的质量下限，不会进碎屑 ✓）
  if (kindUsed[key] >= (x._hits.length ? PER : 3)) continue
  kindUsed[key] += 1
  diversified.push(x)
}

console.log(`偏好（来自日记）: ${prefs.join(' · ')}`)
console.log(`反馈回流: 被赞 ${likedEvents.length} 条 · 她收藏 ${favItems.length} 条 → 学会 ${learnedTokens.length} 个主题词`)
console.log(`已看过/已评论过（已排除）: ${seen.size} 个 BV`)
console.log(`候选池: ${pool.length} 条 → 去重去已看后 ${uniq.length} 条\n`)
console.log(`今天可以看这几条（每词最多 ${PER} 条，共 ${N} 条）：`)
const perKw = {}
let shown = 0
for (const x of diversified) {
  if (shown >= N) break
  perKw[x.kw] = perKw[x.kw] ?? 0
  // 多样性已在上一步做过 → 这里不再二次限流 ✓
  perKw[x.kw] += 1; shown += 1
  console.log(`  ${String(shown).padStart(2)}. ${x.bv}  ${String(x.d).padStart(4)}s  弹幕${String(x.dm).padStart(7)}  播放${String(x.play).padStart(9)}  ${x.t.slice(0, 40)}  @${x.up} ${x._hits.length ? "[" + x._hits.join("+") + "]" : ""}`)
}
console.log('\n看完跑：node bili.mjs debrief <BV>   → 然后把"想法"写进日记的「想说」区（不发）')
