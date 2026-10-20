const VERSION = "f93f0196e0";
const SHELL = ["/","/offline","/games","/word-scrambler","/word-combiner","/scrabble-word-finder","/words-with-friends","/board-solver","/wordle-solver","/anagram-solver","/jumble-solver","/crossword-solver","/text-twist-solver","/letter-hive-solver","/word-grid-solver","/letter-box-solver","/multi-board-solver","/word-ladder-solver","/hangman-solver","/cryptogram-solver","/rhyming-words","/syllable-counter","/training","/printables","/games/crossword","/games/letterpile/arcade","/games/letterpile/practice","/games/letterpile","/games/sudoku","/games/word/hints","/games/word","/games/wordsearch","/word-of-the-day","/data/words.54646e019a.js","/data/common.3c8018bf5c.js","/assets/style.6e1fde4a53.css","/assets/engine.dcd8f86c27.js","/assets/site.44a2558618.js","/assets/worker.3d6414c67f.js","/assets/js/anagram.44f3ec6002.js","/assets/js/board.70e48ee1f6.js","/assets/js/box.3decf23906.js","/assets/js/combiner.94d8f4fd70.js","/assets/js/crossword.8780fa2459.js","/assets/js/crypto.bb6b8927f4.js","/assets/js/finder.b399da8e2c.js","/assets/js/grid.286ecb4940.js","/assets/js/hangman.c166f55062.js","/assets/js/hive.1678e83c7e.js","/assets/js/jumble.173523a9d2.js","/assets/js/ladder.3fe3a98cc8.js","/assets/js/multi.d2c8fef8d8.js","/assets/js/printables.77f51ddd94.js","/assets/js/rhymes.3c5d6aea5f.js","/assets/js/scan-read.824eda5983.js","/assets/js/scan.b042fcb84f.js","/assets/js/scrambler.75587326ad.js","/assets/js/syllables.0d64196c47.js","/assets/js/tools-worker.fd3c506d27.js","/assets/js/training.74b06bd056.js","/assets/js/twist.d1877890ea.js","/assets/js/unscramble.42e1a7461b.js","/assets/js/word.3a34d9898b.js","/assets/js/wordle.198988244b.js","/assets/js/wordtools.43087be543.js","/assets/js/wt-client.cddd0af042.js","/assets/games/band.1cf69cff82.js","/assets/games/core.59e7c2b565.js","/assets/games/crossword.2951688084.js","/assets/games/games.288e92054e.css","/assets/games/hints.a313e5d588.js","/assets/games/hub.789e4a4efc.js","/assets/games/letterpile.002aef7f93.js","/assets/games/lp-engine.fb535fdb8c.js","/assets/games/lp-gen.294b4f0257.js","/assets/games/sd-core.98f22350f0.js","/assets/games/sudoku.773042bce6.js","/assets/games/word.e19240ee15.js","/assets/games/wordsearch.6a18f313d1.js","/assets/games/wotd.d4c4b14d48.js","/assets/games/ws-core.3a5eb94bb5.js","/data/guesses.8f53d846dc.json","/data/lp-words.cd12891e2b.json","/data/ws-themes.a51024568e.json","/manifest.webmanifest","/icons/icon-192.png","/favicon.svg"];
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
