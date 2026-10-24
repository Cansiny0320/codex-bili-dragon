// 正常空闲保持基础间隔；仅连续失败退避，最长 15 分钟（保留更长的自定义间隔）。
export function pollDelay(baseSeconds, failureRounds = 0) {
  const value = Number(baseSeconds)
  const base = Number.isFinite(value) && value > 0 ? Math.max(15, value) : 60
  const rounds = Number.isFinite(failureRounds) ? Math.min(8, Math.max(0, failureRounds)) : 0
  return Math.min(Math.max(base, 900), base * 2 ** rounds) * 1000
}
