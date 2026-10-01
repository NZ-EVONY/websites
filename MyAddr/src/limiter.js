// Durable Object "Limiter": the source of truth for quotas, concurrency slots and the short
// result cache. One instance (idFromName("global")) serves the whole site. It stores only
// pseudonymous IP hashes and timestamps; records are swept after 24 hours.
// Uses the classic fetch() interface (no imports), so the module stays testable in Node.
import { take, acquire, release, cacheGet, cachePut, sweep } from "./lib/ratelimit.js";

const SWEEP_EVERY_MS = 60 * 60 * 1000;

export function storageAdapter(storage) {
  return {
    get: k => storage.get(k),
    put: (k, v) => storage.put(k, v),
    delete: k => storage.delete(k),
    list: async () => storage.list(),
  };
}

export class Limiter {
  constructor(state, env, { now = () => Date.now() } = {}) {
    this.state = state;
    this.store = storageAdapter(state.storage);
    this.now = now;
  }

  async fetch(request) {
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
    let m;
    try { m = await request.json(); } catch { return Response.json({ error: "bad-request" }, { status: 400 }); }
    const now = this.now();
    const last = (await this.store.get("meta:lastSweep")) || 0;
    if (now - last > SWEEP_EVERY_MS) { await sweep(this.store, now); await this.store.put("meta:lastSweep", now); }
    switch (m.op) {
      case "take": return Response.json(await take(this.store, { route: m.route, ipHash: m.ipHash, rule: m.rule, now }));
      case "acquire": return Response.json(await acquire(this.store, { route: m.route, limit: m.limit, now }));
      case "release": await release(this.store, { route: m.route, token: m.token }); return Response.json({ ok: true });
      case "cacheGet": return Response.json({ value: await cacheGet(this.store, m.key, now) });
      case "cachePut": await cachePut(this.store, m.key, m.value, m.ttlMs, now); return Response.json({ ok: true });
      default: return Response.json({ error: "unknown-op" }, { status: 400 });
    }
  }
}

/** Client used by the Worker. Any failure throws, and callers fail closed. */
export function limiterClient(namespace) {
  if (!namespace) return null;
  const stub = namespace.get(namespace.idFromName("global"));
  return async msg => {
    const res = await stub.fetch("https://limiter/op", { method: "POST", body: JSON.stringify(msg), headers: { "content-type": "application/json" } });
    if (!res.ok) throw new Error("limiter-error");
    return res.json();
  };
}
