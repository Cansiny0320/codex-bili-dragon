import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Database } from './types.js';
import { errorCode } from './types.js';
export function atomic(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = file + '.' + crypto.randomUUID() + '.tmp';
  try {
    fs.writeFileSync(
      temp,
      typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n',
      { mode: 0o600 },
    );
    fs.renameSync(temp, file);
  } finally {
    fs.rmSync(temp, { force: true });
  }
}
export function exclusive(file: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = fs.openSync(file, 'wx', 0o600);
      fs.writeFileSync(fd, JSON.stringify({ pid: process.pid }));
      return () => {
        fs.closeSync(fd);
        fs.rmSync(file, { force: true });
      };
    } catch (e) {
      if (errorCode(e) !== 'EEXIST') throw e;
      let owner;
      try {
        owner = JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {
        throw Error('锁文件不完整，请检查运行状态：' + path.basename(file));
      }
      if (!Number.isInteger(owner.pid) || owner.pid < 1) throw Error('无效锁持有者');
      try {
        process.kill(owner.pid, 0);
      } catch (err) {
        if (errorCode(err) === 'ESRCH') {
          fs.unlinkSync(file);
          continue;
        }
      }
      throw Error('另一个操作正在进行：' + path.basename(file));
    }
  }
  throw Error('无法取得锁');
}
export class Store {
  dir: string;
  constructor(dir: string) {
    this.dir = dir;
  }
  file(key: string) {
    if (!/^[a-z0-9-]+$/.test(key)) throw Error('无效数据路径');
    return path.join(this.dir, key + '.json');
  }
  read<K extends keyof Database>(key: K, fallback?: unknown): Database[K];
  read<T = unknown>(key: string, fallback?: T): T;
  read(key: string, fallback: unknown = null): unknown {
    const file = this.file(key);
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      if (errorCode(e) === 'ENOENT') return structuredClone(fallback);
      throw Error('数据损坏，已停止自动处理：' + key);
    }
  }
  write<T>(key: string, value: T): T {
    atomic(this.file(key), value);
    return value;
  }
  update<K extends keyof Database, R>(key: K, fallback: unknown, fn: (data: Database[K]) => R): R;
  update<T, R>(key: string, fallback: T, fn: (data: T) => R): R;
  update<T, R>(key: string, fallback: T, fn: (data: T) => R): R {
    const release = exclusive(this.file(key) + '.lock');
    try {
      const data = this.read(key, fallback);
      const result = fn(data);
      this.write(key, data);
      return (result ?? data) as R;
    } finally {
      release();
    }
  }
}
