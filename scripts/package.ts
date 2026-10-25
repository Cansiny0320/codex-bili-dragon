import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundlePlugin } from './bundle-plugin.ts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
console.log(JSON.stringify(bundlePlugin(root), null, 2));
