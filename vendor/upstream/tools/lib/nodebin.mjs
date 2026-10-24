import { DSH_HOME } from './paths.mjs'
import { resolveRuntime } from './runtime.mjs'
const runtime = resolveRuntime(DSH_HOME, { allowCurrent: true })
export const NODE_EXE = runtime.file
export const NODE_ENV = runtime.env
// Also propagate to existing callers which inherit the tool process environment.
if (runtime.env.ELECTRON_RUN_AS_NODE === '1') process.env.ELECTRON_RUN_AS_NODE = '1'
export const isRealNode = (p = NODE_EXE) => p === NODE_EXE
