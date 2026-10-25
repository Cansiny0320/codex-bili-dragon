const POSITIONAL_SPEC = {
  recon: ['bvid'],
  thread: ['oid', 'bvid', 'root'],
  'check-comment': ['rpid', 'aid', 'bvid'],
  'check-dynamic': ['dyn'],
  'check-mention': ['dyn', 'mid', 'name'],
  'watch-video': ['bvid', 'grid', 'outDir'],
  'dynamic-edit': ['dyn', 'textFile'],
  search: ['kw', 'page'],
  video: ['bvid'],
}
export function translateNamed(cmd, args) {
  const spec = POSITIONAL_SPEC[cmd]
  if (!spec || !args.length) return args
  if (!String(args[0]).startsWith('--')) return args          // 已经是位置参数 → 不动 ✓
  const named = {}
  const flags = []
  for (let i = 0; i < args.length; i += 1) {
    const a = String(args[i])
    if (!a.startsWith('--')) return args                       // 混着位置参数 → 不动
    const k = a.slice(2)
    const v = args[i + 1]
    const flag = v === undefined || String(v).startsWith('--')
    if (!spec.includes(k)) { flags.push(a); if (!flag) { flags.push(v); i += 1 } }
    else if (flag) return args // Missing positional value; preserve command's error.
    else { named[k] = v; i += 1 }
  }
  const given = spec.filter((k) => named[k] !== undefined)
  if (!given.length) return args
  const isPrefix = given.every((k, i) => k === spec[i])        // 必须按顺序前缀 ✓
  if (!isPrefix) return args
  return [...given.map((k) => named[k]), ...flags]
}

