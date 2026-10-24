import {home as _dragonHome,runtime as _dragonRuntime,configFile as _dragonConfig} from '../../../../dist/runtime/vendor-paths.js';
// 启动测试（2026-10-20 加 —— 装完插件先跑这个，一步确认能不能用）
//
//   node bili.mjs selftest
//
// 为什么需要它：很多人装完插件卡在两件事上 ——
//   ① 插件新开的会话在「工作区 → 未分组」里，不点开那个文件夹看不见
//   ② 那个新会话默认没有完全权限，agent 起来后什么都干不了
// 这个命令把"该确认的事"列成一张表，缺哪项就直说缺哪项。
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from '../lib/capture.mjs'
import { fileURLToPath } from 'node:url'
import { dshPath } from '../lib/paths.mjs'
import { NODE_EXE } from '../lib/nodebin.mjs'   // 2026-10-21：别用 process.execPath（Electron 里它是主程序 ✗）


const HOME = (_dragonHome)
const DSH = dshPath()
const CFG = path.join(DSH, 'bili-whale.config.json')
const CRED = path.join(HOME, '.bili-ai', 'credentials.json')
const OK = '✓'
const NO = '✗'
const WARN = '!'

let bad = 0
const line = (mark, label, detail) => {
  if (mark === NO) bad += 1
  console.log(`  ${mark} ${label}${detail ? '  —— ' + detail : ''}`)
}

console.log('\n══════════ 启动测试（装完插件跑这一条）══════════\n')

// ① 配置文件
try {
  const c = JSON.parse(fs.readFileSync(CFG, 'utf8'))
  line(OK, '配置文件', CFG)
  line(c.self?.mid ? OK : NO, '她的身份', c.self?.name ? `${c.self.name}（${c.self.mid}）` : '设置页 →「她是谁」还没填')
  line(c.owner?.mid ? OK : NO, '主人的身份', c.owner?.name ? `${c.owner.name}（${c.owner.mid}）` : '设置页 →「她是谁」里填主人 mid')
  line(c.share?.via ? OK : NO, '分享方式', c.share?.via === 'dm' ? '私信（不发公开评论）' : '评论区 @')
  line(c.notify?.type ? OK : NO, '消息推送', String(c.notify?.type ?? '未设置'))
} catch {
  line(NO, '配置文件', '没有 ' + CFG + ' —— 先去设置页保存一次')
}

// ② 凭据
try {
  const cred = JSON.parse(fs.readFileSync(CRED, 'utf8'))
  const has = !!cred.sessdata && !!cred.bili_jct
  line(has ? OK : NO, 'B站凭据', has ? '已保存（cookie）' : '缺 sessdata / bili_jct')
  line(cred.buvid3 ? OK : WARN, 'buvid3', cred.buvid3 ? '有' : '缺 —— 不影响评论/私信；个别接口可能被风控。想要就 F12 → Cookies 复制 buvid3 再写入')
  // 2026-10-21：bili_jct 是"能不能发东西"的关键 —— 只读全绿但一发就 code=-111，最常见就是它 ✗
  const jct = String(cred.bili_jct ?? '')
  if (!jct) line(NO, 'bili_jct（写操作）', '空着 —— 发私信/评论/收藏都会失败（code=-111）→ 设置页重新粘贴一次')
  else if (!/^[0-9a-fA-F]{32}$/.test(jct)) line(WARN, 'bili_jct（写操作）', '格式不像（长度 ' + jct.length + '，正常 32 位十六进制）—— 可能复制时截断了')
  else line(OK, 'bili_jct（写操作）', '格式正常（和 SESSDATA 是否同一账号，只能靠一次真实写入验证）')
} catch {
  line(NO, 'B站凭据', '没有 ' + CRED + ' —— 设置页粘贴 cookie 后保存')
}

// ③ 登录态
try {
  const BILI0 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'bili.mjs')
  const out = execFileSync(NODE_EXE, [BILI0, 'session'], { encoding: 'utf8', timeout: 30000 })
  const who = out.match(/账号\s*:\s*(.+)/) ?? []
  const midM = out.match(/mid\s*:\s*(\d+)/) ?? []
  line(who[1] ? OK : NO, '登录态', who[1] ? `${who[1].trim()}（mid ${midM[1] ?? '?'}）` : String(out).trim().slice(0, 80))
} catch (e) {
  line(NO, '登录态', '查不到（cookie 可能过期）—— ' + String(e.message).slice(0, 60))
}

// ④ 数据目录
// 2026-10-23 修（issue #27）：'.dsh' 那条要看 DSH_HOME ✗ 不能写死 HOME/.dsh
for (const [label, p] of [['.bili-ai', path.join(HOME, '.bili-ai')], ['DSH_HOME', DSH]]) {
  line(fs.existsSync(p) ? OK : NO, '目录 ' + label, p)
}
const DIARY = path.join(DSH, 'whale-diary.md')
line(fs.existsSync(DIARY) ? OK : WARN, '日记', fs.existsSync(DIARY) ? '已存在' : '还没建（她第一次醒来会写）')

// ⑤ 依赖体检（直接调现成的 deps，别在这里重复实现 ✗）
try {
  const BILI2 = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'bili.mjs')
  const out = execFileSync(NODE_EXE, [BILI2, 'deps'], { encoding: 'utf8', timeout: 60000 })
  const reds = (String(out).match(/✗/g) ?? []).length
  line(reds === 0 ? OK : NO, '依赖体检（deps）', reds === 0 ? '全绿' : `${reds} 项红 —— 详见 \`node bili.mjs deps\``)
} catch (e) {
  line(WARN, '依赖体检（deps）', '没跑起来：' + String(e.message).slice(0, 60))
}

// ⑥ 告诉她/他 下一步该做什么（这一步是很多人卡住的地方）
console.log('\n────────── 接下来要做的两件事（很多人卡在这）──────────\n')
console.log('  ① 【找到她的会话】')
console.log('     插件启动时会自动开一个会话，位置在：')
console.log('       左侧「工作区」→ 展开「未分组」文件夹 → 里面那个 bili-whale')
console.log('     ⚠️ 不点开「未分组」是看不见它的 —— 这一步最容易漏 ✗')
console.log('')
console.log('  ② 【给她完全权限】')
console.log('     打开那个会话 → 权限设置 → 选「完全访问 / danger-full-access」')
console.log('     否则她起来后跑不了命令、发不了评论、写不了日记 ✗')
console.log('')
// 2026-10-20：全绿时落个标记 —— 设置页和她的唤醒提示会用它在"还没测过"时提醒
if (bad === 0) {
  try {
    fs.mkdirSync(path.join(HOME, '.bili-ai'), { recursive: true })
    fs.writeFileSync(path.join(HOME, '.bili-ai', 'selftest-passed.json'), JSON.stringify({ at: new Date().toISOString() }, null, 2))
  } catch {}
  console.log('══════════ 全部通过 ✓ 可以用了 ══════════')
  console.log('  想立刻看她跑一轮：设置页 →「生物钟」→ 把窗口改成现在之后 2 分钟 → 等她自己醒\n')
} else {
  console.log(`══════════ ${bad} 项没通过 ✗ 按上面的提示补一下 ══════════\n`)
}
process.exit(bad === 0 ? 0 : 1)
