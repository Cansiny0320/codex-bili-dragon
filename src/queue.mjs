import crypto from "node:crypto";
export class Queue {
  constructor(store) {
    this.store = store;
  }
  list() {
    return this.store.read("jobs", []);
  }
  add(key, type, payload) {
    return this.store.update("jobs", [], (items) => {
      const old = items.find((j) => j.key === key);
      if (old) return old;
      const job = {
        id: crypto.randomUUID(),
        key,
        type,
        payload,
        state: "pending",
        createdAt: new Date().toISOString(),
      };
      items.push(job);
      return job;
    });
  }
  claim() {
    let found = null;
    this.store.update("jobs", [], (items) => {
      found = items.find((j) => j.state === "pending") || null;
      if (found) {
        found.state = "running";
        found.startedAt = new Date().toISOString();
      }
    });
    return found;
  }
  finish(id, state, result) {
    return this.store.update("jobs", [], (items) => {
      const j = items.find((x) => x.id === id);
      if (!j) throw Error("找不到任务");
      Object.assign(j, { state, result, finishedAt: new Date().toISOString() });
      return j;
    });
  }
  recover() {
    this.store.update("jobs", [], (items) => {
      for (const j of items)
        if (j.state === "running") {
          j.state = "needs-review";
          j.result = "上次后台中断，结果不确定，未自动重跑。";
        }
    });
  }
  dismiss(id) {
    return this.finish(id, "dismissed", "用户已核查并关闭");
  }
}
