import { guardedFetch as fetch } from '../lib/traffic.mjs'
// Is the @ a real mention node on the opus page (linked, with the target's mid)?
//
// 用法: node mention-check.mjs <dynId> [mid] [昵称]
//   不给 mid/昵称时，从配置里的 owner 取 ✓
//
// 2026-10-21 修（外部审计 #2）：原来这里搜的是写死的字面量
//   `<主人昵称>` / `999999003` / `hello world` / `测试动态` —— 作者调试现场残留，
//   开源清洗时漏了，导致这个命令对任何用户都返回无意义结果 ✗
import { config } from '../lib/config.mjs'

const dynId = process.argv[2]
if (!dynId) {
  console.error('用法: node mention-check.mjs <dynId> [mid] [昵称]')
  console.error('      （不给 mid/昵称时用配置里的 owner）')
  process.exit(2)
}
const TARGET_MID = String(process.argv[3] ?? config().owner?.mid ?? '').trim()
const TARGET_NAME = String(process.argv[4] ?? config().owner?.name ?? '').trim()
if (!TARGET_MID && !TARGET_NAME) {
  console.error('✗ 不知道要查谁：给我 mid 或昵称，或者在设置页填「主人 mid / 昵称」')
  process.exit(2)
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const r = await fetch(`https://www.bilibili.com/opus/${dynId}`, {
  headers: { 'user-agent': UA, 'accept-language': 'zh-CN,zh;q=0.9' },
})
const html = await r.text()
console.log(`opus 页 HTTP ${r.status}  ${html.length} 字节`)
console.log(`目标: ${TARGET_NAME || '(未给昵称)'} · mid ${TARGET_MID || '(未给 mid)'}`)

// ① mid 出现次数（真提及一般会把 mid 写进链接或 data 属性）
if (TARGET_MID) {
  const n = html.split(TARGET_MID).length - 1
  console.log(`\nmid ${TARGET_MID} 在页面出现 ${n} 次${n > 0 ? ' ✓（很可能是真提及节点）' : ' ✗（可能没提及，或页面内容要等 JS 渲染）'}`)
  if (n > 0) {
    const k = html.indexOf(TARGET_MID)
    console.log('  上下文（前后各 300 字符）：')
    console.log(html.slice(Math.max(0, k - 300), k + 300).replace(/></g, '>\n<'))
  }
}

// ② 昵称出现次数 + 上下文（看它被什么标签包着）
if (TARGET_NAME) {
  const i = html.indexOf(TARGET_NAME)
  const cnt = html.split(TARGET_NAME).length - 1
  console.log(`\n昵称「${TARGET_NAME}」出现 ${cnt} 次`)
  if (i >= 0) {
    console.log('  上下文（前后各 300 字符）：')
    console.log(html.slice(Math.max(0, i - 300), i + 200).replace(/></g, '>\n<'))
  } else {
    console.log('  页面上没找到该昵称 ✗')
  }
}

// ③ 判定参考（给人看，不做机器判定）
const hasMid = TARGET_MID ? html.includes(TARGET_MID) : false
const hasName = TARGET_NAME ? html.includes(TARGET_NAME) : false
console.log('\n结论参考：')
if (hasMid) console.log('  ✓ 页面里带目标 mid → @ 可能是【真提及节点】（点得动、对方会收到通知）')
else if (hasName) console.log('  ⚠️ 只有昵称没有 mid → 多半是【纯文本 @】（对方收不到通知）')
else console.log('  ✗ 昵称和 mid 都没找到 —— 可能没提及，或动态内容要等 JS 渲染（本脚本只取原始 HTML）')
