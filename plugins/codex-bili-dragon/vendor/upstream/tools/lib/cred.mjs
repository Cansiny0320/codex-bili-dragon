// 凭据的共用层（2026-10-21 加）
//
// 为什么要有它：写操作（私信 / 评论 / 收藏 / 弹幕）全都要 csrf = bili_jct，
// 但只要 bili_jct 缺了、或和 SESSDATA 不是同一个账号的，B站就回一个裸的
//   HTTP 200 code=-111 CSRF 校验失败
// 用户看到这个只会懵 ✗（只读接口还能用，所以"体检全绿、能查到账号"反而更迷惑）
//
// 这一层做三件事：
//   ① 读凭据时统一 trim（粘贴时常带空格/换行 ✗）
//   ② 缺字段直接说缺哪个，而不是拿 undefined 去发请求
//   ③ 把常见错误码翻译成人话（-101 / -111 / 12015 / 10031 / 12051 / -352）
import fs from 'node:fs'
import path from 'node:path'

import { credentialsPath } from './paths.mjs'
export const CRED_PATH = credentialsPath

/** 读凭据：统一 trim，容忍 BOM / 首尾空白。 */
export function loadCred() {
  let raw
  try {
    raw = fs.readFileSync(CRED_PATH, 'utf8')
  } catch {
    throw new Error(`没有凭据文件：${CRED_PATH}\n  去设置页粘贴一次 cookie 并保存 ✓`)
  }
  let j
  try {
    j = JSON.parse(raw.replace(/^\uFEFF/, ''))
  } catch (e) {
    throw new Error(`凭据文件不是合法 JSON：${CRED_PATH}\n  ${String(e.message).slice(0, 80)}`)
  }
  const clean = (v) => String(v ?? '').replace(/^["'\s]+|["'\s]+$/g, '')
  return {
    sessdata: clean(j.sessdata),
    bili_jct: clean(j.bili_jct),
    buvid3: clean(j.buvid3),
  }
}

/**
 * 写操作前检查。
 * @param {object} cred
 * @param {{needBuvid3?: boolean}} [opt]
 * @returns {string[]} 缺什么（空数组 = 可以继续）
 */
export function missingForWrite(cred, opt = {}) {
  const miss = []
  if (!cred.sessdata) miss.push('SESSDATA（登录态）')
  if (!cred.bili_jct) miss.push('bili_jct（写操作必须的 csrf token）')
  if (opt.needBuvid3 && !cred.buvid3) miss.push('buvid3')
  return miss
}

/** bili_jct 的格式自检：B站 目前是 32 位十六进制。 */
export function looksLikeJct(v) {
  return /^[0-9a-fA-F]{32}$/.test(String(v ?? ''))
}

/** 常见返回码 → 人话 + 怎么办 */
export const CODE_HINTS = {
  0: '成功',
  '-101': '账号未登录 —— SESSDATA 失效了，重新复制一次 cookie',
  '-111': 'CSRF 校验失败 —— bili_jct 和当前 SESSDATA 不是同一个账号，或者 bili_jct 已经过期\n' +
    '        怎么办：重新登录 B站 → F12 复制一次【两个都要重抄】（SESSDATA + bili_jct）✓\n' +
    '        提示：只读接口（体检 / 查账号 / 看评论）还能用，所以"体检全绿"不代表能发东西 ✗',
  '-400': '请求参数错误（少见：通常是参数没传对）',
  '-352': '风控拦截 —— 请求太快或太像机器人，等几分钟再来',
  '-799': '请求过于频繁 —— 退避一会儿',
  10031: '操作太快（频率限制）—— 退避，别连发',
  12015: '需要验证码 —— 停下，人在浏览器里手动过一次',
  12051: '疑似刷屏 —— 停下，别再发',
  12002: '评论区已关闭 / 不能评论',
}

/** 把返回码变成一行可读的说明（含数字，方便搜）。 */
export function explainCode(code) {
  const k = String(code)
  const h = CODE_HINTS[k]
  return h ? `code=${k} ${h}` : `code=${k}（未知返回码）`
}

/** 组合：写操作失败的统一报错文本 */
export function writeFailText(code, message) {
  return `✗ 发送失败：HTTP 200 ${explainCode(code)}${message ? `（B站原文：${message}）` : ''}`
}
