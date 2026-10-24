// Adapted from upstream night-plan.mjs; calendar math uses the configured IANA zone.
import { DateTime } from "luxon";
const minutes = (s) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
function stamp(day, n) {
  return day
    .plus({ days: Math.floor(n / 1440) })
    .set({
      hour: Math.floor((n % 1440) / 60),
      minute: n % 60,
      second: 0,
      millisecond: 0,
    })
    .toMillis();
}
export function occurrences(c, now) {
  const today = DateTime.fromMillis(now, { zone: c.timezone }).startOf("day");
  return c.night.windows
    .flatMap((w) => {
      const start = minutes(w.start),
        end = minutes(w.end) + (minutes(w.end) <= start ? 1440 : 0);
      return [-1, 0].map((offset) => {
        const d = today.plus({ days: offset });
        return {
          ...w,
          key: `${d.toISODate()}|${w.start}–${w.end}`,
          start: stamp(d, start),
          end: stamp(d, end),
        };
      });
    })
    .filter((w) => w.end > now)
    .sort((a, b) => a.end - b.end);
}
export const inWindow = (c, now = Date.now()) =>
  occurrences(c, now).some((w) => w.start <= now && w.end > now && w.wakes > 0);
export function plan(c, state = {}, now = Date.now(), random = Math.random) {
  const signature = JSON.stringify([c.timezone, c.night]);
  if (
    state.signature === signature &&
    state.action !== "done" &&
    !state.fired &&
    state.endsAt > now
  )
    return state;
  const used = { ...state.used };
  const cutoff = DateTime.fromMillis(now, { zone: c.timezone })
    .minus({ days: 7 })
    .toISODate();
  for (const key of Object.keys(used))
    if (key.slice(0, 10) < cutoff) delete used[key];
  const base = { used, lastAt: state.lastAt || 0, signature };
  for (const w of occurrences(c, now)) {
    const usedOnDay = Object.entries(used)
      .filter(([key]) => key.slice(0, 10) === w.key.slice(0, 10))
      .reduce((sum, [, n]) => sum + n, 0);
    if (usedOnDay >= 3) continue;
    if ((used[w.key] || 0) >= w.wakes) continue;
    const from = Math.max(
      now,
      w.start,
      base.lastAt + c.night.minGapMin * 60000,
    );
    if (from >= w.end - 1000) continue;
    return {
      ...base,
      action: random() < c.night.skipChance ? "skip" : "browse",
      windowKey: w.key,
      startsAt: w.start,
      endsAt: w.end,
      atMs: from + Math.floor(random() * (w.end - from)),
      fired: false,
    };
  }
  return { ...base, action: "done" };
}
export function complete(p, now = Date.now()) {
  if (p.fired) return p;
  return {
    ...p,
    fired: true,
    lastAt: now,
    used: { ...p.used, [p.windowKey]: (p.used?.[p.windowKey] || 0) + 1 },
  };
}
