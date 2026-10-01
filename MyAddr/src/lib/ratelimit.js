// Quota logic for the Limiter Durable Object, written against a small storage interface
// ({ get, put, delete, list }) so it can be unit-tested with an in-memory map and an
// injected clock. Keys hold pseudonymous IP hashes only, never raw IPs.

const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

async function stamps(store, key, now, keepMs) {
  const list = (await store.get(key)) || [];
  return list.filter(t => now - t < keepMs);
}

// Sliding-window check over several windows. Returns { ok, retryAfterSeconds }.
async function checkWindows(store, key, windows, now) {
  const longest = Math.max(...windows.map(w => w.ms));
  const list = await stamps(store, key, now, longest);
  for (const w of windows) {
    const inWin = list.filter(t => now - t < w.ms);
    if (inWin.length >= w.limit) {
      const oldest = Math.min(...inWin);
      return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + w.ms - now) / 1000)), list };
    }
  }
  return { ok: true, list };
}

/** Atomically (inside one Durable Object) check and record a request. rule:
 *  { perIp: [{limit, ms}], global: [{limit, ms}] }. */
export async function take(store, { route, ipHash, rule, now }) {
  const ipKey = `q:${route}:${ipHash}`, gKey = `g:${route}`;
  const ipWins = rule.perIp || [], gWins = rule.global || [];
  const a = ipWins.length ? await checkWindows(store, ipKey, ipWins, now) : { ok: true, list: [] };
  if (!a.ok) return { ok: false, scope: "ip", retryAfterSeconds: a.retryAfterSeconds };
  const b = gWins.length ? await checkWindows(store, gKey, gWins, now) : { ok: true, list: [] };
  if (!b.ok) return { ok: false, scope: "global", retryAfterSeconds: b.retryAfterSeconds };
  if (ipWins.length) await store.put(ipKey, [...a.list, now]);
  if (gWins.length) await store.put(gKey, [...b.list, now]);
  return { ok: true };
}

/** Concurrency slots with expiry, so a crashed request can't hold a slot forever. */
export async function acquire(store, { route, limit, now, holdMs = 15_000 }) {
  const key = `c:${route}`;
  const slots = ((await store.get(key)) || []).filter(t => now - t < holdMs);
  if (slots.length >= limit) return { ok: false, retryAfterSeconds: 5 };
  slots.push(now);
  await store.put(key, slots);
  return { ok: true, token: now };
}

export async function release(store, { route, token }) {
  const key = `c:${route}`;
  const slots = (await store.get(key)) || [];
  const i = slots.indexOf(token);
  if (i >= 0) slots.splice(i, 1);
  await store.put(key, slots);
}

export async function cacheGet(store, key, now) {
  const v = await store.get(`r:${key}`);
  if (!v) return null;
  if (v.expires <= now) { await store.delete(`r:${key}`); return null; }
  return v.value;
}

export async function cachePut(store, key, value, ttlMs, now) {
  await store.put(`r:${key}`, { value, expires: now + ttlMs });
}

/** Lazy cleanup: drop every record older than the retention period. */
export async function sweep(store, now, retentionMs = DAY) {
  const all = await store.list();
  for (const [k, v] of all) {
    if (k.startsWith("r:")) { if (v.expires <= now) await store.delete(k); continue; }
    if (Array.isArray(v)) {
      const keep = v.filter(t => now - t < retentionMs);
      if (!keep.length) await store.delete(k);
      else if (keep.length !== v.length) await store.put(k, keep);
    }
  }
}

export const WINDOWS = { MIN, HOUR, DAY };
