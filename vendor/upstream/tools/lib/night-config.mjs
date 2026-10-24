import {home as _dragonHome,runtime as _dragonRuntime,configFile as _dragonConfig} from '../../../../src/vendor-paths.mjs';
import fs from 'node:fs'
import path from 'node:path'
import { DSH_HOME } from './paths.mjs'
export function readNightConfig(home = DSH_HOME) {
  let user = {}, legacy = {}
  try { user = JSON.parse(fs.readFileSync(_dragonConfig || path.join(home, 'bili-whale.config.json'), 'utf8')).night ?? {} } catch {}
  try { legacy = JSON.parse(fs.readFileSync(path.join(home, 'whale-night.config.json'), 'utf8')) } catch {}
  return { windows: [{ start: '20:00', end: '24:00', wakes: 1 }], skipChance: 0.3, minGapMin: 10, maxVideos: 5, ...user, ...legacy }
}
