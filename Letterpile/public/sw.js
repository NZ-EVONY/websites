const VERSION = "36594a5476";
const SHELL = ["/","/offline","/games","/word-scrambler","/word-combiner","/tile-word-finder","/words-with-friends","/board-solver","/wordle-solver","/anagram-solver","/jumble-solver","/crossword-solver","/text-twist-solver","/letter-hive-solver","/word-grid-solver","/letter-box-solver","/multi-board-solver","/word-ladder-solver","/hangman-solver","/cryptogram-solver","/rhyming-words","/syllable-counter","/training","/printables","/games/crossword","/games/letterpile/arcade","/games/letterpile/practice","/games/letterpile","/games/sudoku","/games/word/hints","/games/word","/games/wordsearch","/word-of-the-day","/data/words.54646e019a.js","/data/common.3c8018bf5c.js","/assets/style.6a81e1927d.css","/assets/engine.ed557a7f92.js","/assets/site.bc6e8b8c1b.js","/assets/worker.e14a89eab6.js","/assets/js/anagram.130ec159cb.js","/assets/js/board.8127135921.js","/assets/js/box.dc07c8f76e.js","/assets/js/combiner.2c65f21de8.js","/assets/js/crossword.2fe55d7808.js","/assets/js/crypto.c268fc02ec.js","/assets/js/finder.a9d107f651.js","/assets/js/grid.9d892d510f.js","/assets/js/hangman.9ffdb97eee.js","/assets/js/hive.6202284c3f.js","/assets/js/jumble.42a6fe1ba4.js","/assets/js/ladder.2279c2cf73.js","/assets/js/multi.05866642f2.js","/assets/js/printables.a39e86ee11.js","/assets/js/rhymes.495300507a.js","/assets/js/scan-read.40b964b012.js","/assets/js/scan.6c7c32d49f.js","/assets/js/scrambler.d8cf35359a.js","/assets/js/syllables.1ebd16224a.js","/assets/js/tools-worker.a4d2456c0a.js","/assets/js/training.1f17cd5c15.js","/assets/js/twist.491be3f1f8.js","/assets/js/unscramble.27e3829d4c.js","/assets/js/word.de9bfbd39c.js","/assets/js/wordle.f578f739d2.js","/assets/js/wordtools.31af6d9a8a.js","/assets/js/wt-client.c7d6bad137.js","/assets/games/band.9145e92160.js","/assets/games/core.c1124e0288.js","/assets/games/crossword.09ebd19711.js","/assets/games/games.0f1dac0775.css","/assets/games/hints.5f40da8e1a.js","/assets/games/hub.e62bc745fe.js","/assets/games/letterpile.aa72ee9dcc.js","/assets/games/lp-engine.2c1d344b88.js","/assets/games/lp-gen.7834e1951c.js","/assets/games/sd-core.5ca4cd350a.js","/assets/games/sudoku.b44a7fa97e.js","/assets/games/word.8fec59c70b.js","/assets/games/wordsearch.9ce24bf5cb.js","/assets/games/wotd.394c8b89aa.js","/assets/games/ws-core.7d5fef9f54.js","/data/guesses.8f53d846dc.json","/data/lp-words.cd12891e2b.json","/data/ws-themes.a51024568e.json","/manifest.webmanifest","/icons/icon-192.png","/favicon.svg"];
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
