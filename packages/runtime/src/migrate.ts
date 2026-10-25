import fs from 'node:fs';
import path from 'node:path';

export function migrateData(source: string, target: string) {
  if (!path.isAbsolute(source) || !path.isAbsolute(target)) throw Error('数据目录必须为绝对路径');
  const from = fs.realpathSync(source),
    to = path.resolve(target);
  if (!fs.statSync(from).isDirectory()) throw Error('旧数据目录不存在');
  const relative = path.relative(from, to);
  if (!relative || (!relative.startsWith('..') && !path.isAbsolute(relative)))
    throw Error('新数据目录不能位于旧目录中');
  if (fs.existsSync(to) && fs.readdirSync(to).length) throw Error('目标目录已有数据，未覆盖');
  fs.cpSync(from, to, {
    recursive: true,
    filter: (file) => {
      if (fs.lstatSync(file).isSymbolicLink()) throw Error('旧数据含符号链接，请先核查');
      return !/\.lock$|\.tmp$|^(?:connection\.json|server\.log)$/.test(path.basename(file));
    },
  });
  return { migrated: true, source: from, target: to };
}
