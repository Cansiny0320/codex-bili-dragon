// Count actual events, never a changing digest of the whole result window.
export function newReplies(items, feedback, now = Date.now()) {
  const seen = new Set(feedback.replyIds ?? [])
  const watermark = Number(feedback.lastReplyTime ?? 0)
  const fresh = []
  for (const r of items ?? []) {
    const time = Date.parse(r.time)
    const id = `${r.kind}:${r.id || `${r.mid}:${r.rpid}:${r.time}`}`
    if (!Number.isFinite(time) || time <= 0 || time > now || time < watermark || seen.has(id)) continue
    seen.add(id); fresh.push({ id, time })
  }
  return { fresh, ids: [...seen].slice(-1000), time: Math.max(watermark, ...fresh.map(r => r.time)) }
}
