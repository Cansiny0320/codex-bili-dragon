import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareMarketplace } from './marketplace.ts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
console.log(JSON.stringify(prepareMarketplace(path.join(root, 'dist/plugin'), root), null, 2));
