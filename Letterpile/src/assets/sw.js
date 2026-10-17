/* Letterpile service worker (the build prepends VERSION and SHELL). Pages are network-first, so
   anyone online always gets the latest version; hashed assets and word lists are cache-first
   (their names change when they change); puzzles are network-first with the next week cached.
   A new build means a new VERSION: the new worker installs, takes over at once and deletes the
   old caches, so nobody is left on an old version. */
"use strict";
const SHELL_CACHE = `lp-shell-${VERSION}`, PAGES = "lp-pages", PUZZLES = "lp-puzzles", MAX_PAGES = 150;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("lp-shell-") && k !== SHELL_CACHE) await caches.delete(k);
    await self.clients.claim();
    await prefetchPuzzles();
  })());
});

self.addEventListener("message", e => { if (e.data === "prefetch") e.waitUntil(prefetchPuzzles()); });

const day = n => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
// Today's and the next seven days' puzzles for every game; drops ones more than 8 days old.
async function prefetchPuzzles() {
  try {
    const res = await fetch("/puzzles/manifest.json", { cache: "no-cache" });
    if (!res.ok) return;
    const m = await res.clone().json();
    const c = await caches.open(PUZZLES);
    await c.put("/puzzles/manifest.json", res);
    const from = day(-7), to = day(7);
    const want = Object.entries(m.games || {}).flatMap(([game, dates]) => dates.filter(d => d >= day(-1) && d <= to).map(d => `/puzzles/${game}/${d}.json`));
    const have = new Set((await c.keys()).map(r => new URL(r.url).pathname));
    await Promise.all(want.filter(u => !have.has(u)).map(u => c.add(u).catch(() => {})));
    for (const req of await c.keys()) { const d = new URL(req.url).pathname.match(/(\d{4}-\d{2}-\d{2})\.json$/); if (d && d[1] < from) await c.delete(req); }
  } catch {}
}

async function trim(cache) {
  const keys = await cache.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - MAX_PAGES))) await cache.delete(k);
}

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  // Hashed assets, word lists and self-hosted libraries never change under the same name.
  if (/^\/(assets|data|vendor|icons)\//.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && !url.pathname.startsWith("/vendor/")) { const copy = res.clone(); caches.open(SHELL_CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  if (url.pathname.startsWith("/puzzles/")) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(PUZZLES).then(c => c.put(url.pathname, copy)); }
      return res;
    }).catch(() => caches.open(PUZZLES).then(c => c.match(url.pathname)).then(hit => hit || Response.error())));
    return;
  }
  if (req.mode === "navigate") {
    // Network first; offline, the cached copy of the page (any query string), else the offline page.
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(PAGES).then(c => c.put(url.pathname, copy).then(() => trim(c))); }
      return res;
    }).catch(async () => (await caches.match(url.pathname, { ignoreSearch: true })) || caches.match("/offline")));
  }
});
