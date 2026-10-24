import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
export function atomic(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temp = file + "." + crypto.randomUUID() + ".tmp";
  try {
    fs.writeFileSync(
      temp,
      typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n",
      { mode: 0o600 },
    );
    fs.renameSync(temp, file);
  } finally {
    fs.rmSync(temp, { force: true });
  }
}
export function exclusive(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = fs.openSync(file, "wx", 0o600);
      fs.writeFileSync(fd, JSON.stringify({ pid: process.pid }));
      return () => {
        fs.closeSync(fd);
        fs.rmSync(file, { force: true });
      };
    } catch (e) {
      if (e.code !== "EEXIST") throw e;
      let owner;
      try {
        owner = JSON.parse(fs.readFileSync(file, "utf8"));
      } catch {
        throw Error("锁文件不完整，请检查运行状态：" + path.basename(file));
      }
      if (!Number.isInteger(owner.pid) || owner.pid < 1)
        throw Error("无效锁持有者");
      try {
        process.kill(owner.pid, 0);
      } catch (err) {
        if (err.code === "ESRCH") {
          fs.unlinkSync(file);
          continue;
        }
      }
      throw Error("另一个操作正在进行：" + path.basename(file));
    }
  }
  throw Error("无法取得锁");
}
export class Store {
  constructor(dir) {
    this.dir = dir;
  }
  file(key) {
    if (!/^[a-z0-9-]+$/.test(key)) throw Error("无效数据路径");
    return path.join(this.dir, key + ".json");
  }
  read(key, fallback = null) {
    const file = this.file(key);
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return structuredClone(fallback);
      throw Error("数据损坏，已停止自动处理：" + key);
    }
  }
  write(key, value) {
    atomic(this.file(key), value);
    return value;
  }
  update(key, fallback, fn) {
    const release = exclusive(this.file(key) + ".lock");
    try {
      const data = this.read(key, fallback);
      const result = fn(data);
      this.write(key, data);
      return result ?? data;
    } finally {
      release();
    }
  }
}
