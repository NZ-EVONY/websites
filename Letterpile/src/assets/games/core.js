/* Letterpile daily games: shared core. Picks the day's puzzle by the date in UTC, runs the
   countdown to 00:00 UTC and the "new puzzles" banner, saves progress in localStorage, and
   shares results. Loaded after site.js on game pages and the hub; the date functions also run
   in Node for the unit tests. See GAMES.md. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.Games = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const DAY = 86400000;
  const ARCHIVE_DAYS = 7;

  // ---------- dates (always UTC) ----------

  // Correction for a device clock that is clearly wrong, from the server's Date header.
  let offset = 0;
  const now = () => Date.now() + offset;
  const isoDate = ms => new Date(ms).toISOString().slice(0, 10);
  const today = (ms = now()) => isoDate(ms);
  const addDays = (iso, n) => isoDate(Date.parse(iso + "T00:00:00Z") + n * DAY);
  const msToMidnight = (ms = now()) => DAY - (ms % DAY);
  const isIso = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && isoDate(Date.parse(s + "T00:00:00Z")) === s;
  // Which date to play: ?date= is honoured only for the previous ARCHIVE_DAYS days.
  function pickDate(requested, ms = now()) {
    const t = today(ms);
    if (!isIso(requested) || requested >= t || requested < addDays(t, -ARCHIVE_DAYS)) return { date: t, archive: false };
    return { date: requested, archive: true };
  }
  // Server clock from a Date header: used only if the device is more than 5 minutes out.
  function setServerTime(header, deviceMs = Date.now()) {
    const server = Date.parse(header || "");
    if (!isNaN(server) && Math.abs(server - deviceMs) > 5 * 60000) offset = server - deviceMs;
    else offset = 0;
    return offset;
  }
  const longDate = iso => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  const clock = ms => {
    const s = Math.max(0, Math.floor(ms / 1000));
    return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, "0")).join(":");
  };
  const duration = s => (s >= 3600 ? `${Math.floor(s / 3600)}:` + String(Math.floor(s / 60) % 60).padStart(2, "0") : String(Math.floor(s / 60))) + ":" + String(s % 60).padStart(2, "0");

  // Light obfuscation for answers in the puzzle files (keeps them out of plain sight; not secret).
  function decode(s, key) {
    const bin = typeof atob === "function" ? atob(s) : Buffer.from(s, "base64").toString("binary");
    let out = "";
    for (let i = 0; i < bin.length; i++) out += String.fromCharCode(bin.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    return out;
  }

  // ---------- storage (every access wrapped: private windows and blocked storage throw) ----------

  const key = (game, date) => `lp-game:${game}:${date}`;
  function load(k, fallback = null) {
    try { const v = localStorage.getItem(k); return v == null ? fallback : JSON.parse(v); } catch { return fallback; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; }
  }
  const state = (game, date) => load(key(game, date));
  const status = (game, date) => { const s = state(game, date); return !s ? "new" : s.done ? (s.won === false ? "lost" : "solved") : "playing"; };

  // ---------- browser-only helpers ----------

  const $ = (s, r = document) => r.querySelector(s);
  function toast(msg) { if (window.UI?.toast) window.UI.toast(msg); }
  async function share(text) {
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); toast("Result copied"); return true; }
    } catch {}
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.className = "sr-only";
      document.body.append(ta); ta.select();
      const ok = document.execCommand("copy"); ta.remove();
      toast(ok ? "Result copied" : "Couldn't copy"); return ok;
    } catch { toast("Couldn't copy"); return false; }
  }

  // Share buttons ([data-share], from shareRow in game-cards.mjs): the native share sheet where
  // the browser has one; "Copy result"; and "Share to Facebook", which copies the text (Facebook
  // doesn't accept prefilled text) and opens its share page for the game's address.
  function shareBar(row, getText, path) {
    if (!row) return;
    const url = "https://letterpile.app" + path;
    const native = row.querySelector("[data-share-native]");
    if (native && navigator.share) {
      native.hidden = false;
      native.addEventListener("click", async () => {
        try { await navigator.share({ text: getText(), url }); } catch (e) { if (e?.name !== "AbortError") share(getText()); }
      });
    }
    row.querySelector("[data-share-copy]")?.addEventListener("click", () => share(getText()));
    row.querySelector("[data-share-fb]")?.addEventListener("click", async () => {
      // Open the window first (inside the click), so popup blockers allow it.
      const w = window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "noopener,width=600,height=500");
      try { await navigator.clipboard.writeText(getText()); toast("Result copied — paste it into your post"); } catch { toast("Paste your result into the post"); }
      if (!w) toast("Allow pop-ups to open Facebook");
    });
  }

  // Manifest of available dates; its Date header also corrects a wrong device clock.
  let manifestP = null;
  function manifest() {
    if (!manifestP) manifestP = fetch("/puzzles/manifest.json", { cache: "no-cache" }).then(r => {
      setServerTime(r.headers.get("Date"));
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).catch(() => ({ games: {} }));
    return manifestP;
  }

  // Countdown to 00:00 UTC on every [data-countdown]; at rollover, shows [data-rollover].
  function countdown(onRollover) {
    const els = document.querySelectorAll("[data-countdown]");
    let day = today();
    const tick = () => {
      const left = msToMidnight();
      els.forEach(el => { el.textContent = clock(left); el.dateTime = `PT${Math.ceil(left / 1000)}S`; });
      if (today() !== day) {
        day = today();
        document.querySelectorAll("[data-rollover]").forEach(b => { b.hidden = false; });
        onRollover?.();
      }
    };
    tick();
    setInterval(tick, 1000);
    document.addEventListener("click", e => { if (e.target.closest("[data-refresh]")) location.reload(); });
  }

  // A stopwatch that only runs while the page is visible; elapsed seconds survive reloads.
  function timer(el, start = 0, onTick) {
    let base = start, since = null, id = null;
    const elapsed = () => base + (since ? Math.floor((Date.now() - since) / 1000) : 0);
    const draw = () => { if (el) el.textContent = duration(elapsed()); onTick?.(elapsed()); };
    const t = {
      elapsed,
      start() { if (since) return; since = Date.now(); id = setInterval(draw, 1000); draw(); },
      stop() { if (!since) return; base = elapsed(); since = null; clearInterval(id); draw(); },
      running: () => !!since,
    };
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && since) { t.stop(); t.paused = true; } else if (!document.hidden && t.paused) { t.paused = false; t.start(); }
    });
    draw();
    return t;
  }

  // Loads the puzzle for this page. Resolves { date, archive, puzzle } or { date, archive, puzzle: null }
  // when there is no puzzle for that date (the page then shows "Come back soon").
  async function open(game) {
    const m = await manifest();
    const { date, archive } = pickDate(new URLSearchParams(location.search).get("date"));
    const dateEl = $("[data-game-date]");
    if (dateEl) dateEl.textContent = (archive ? "From the archive: " : "") + longDate(date);
    countdown();
    const dates = m.games?.[game] || [];
    let puzzle = null;
    if (dates.includes(date)) {
      try {
        const r = await fetch(`/puzzles/${game}/${date}.json`);
        if (r.ok) puzzle = await r.json();
      } catch {}
    }
    return { date, archive, puzzle, dates };
  }

  function comeBackSoon(container) {
    container.innerHTML = `<div class="come-back"><p class="big">Come back soon</p><p>Today's puzzle isn't ready yet. We're working on the next batch; please check again later.</p><p><a href="/games">See the other daily games</a></p></div>`;
  }

  // Last ARCHIVE_DAYS dates that have a puzzle, newest first.
  const archiveDates = (dates, ms = now()) => { const t = today(ms); return dates.filter(d => d < t && d >= addDays(t, -ARCHIVE_DAYS)).sort().reverse(); };

  return { ARCHIVE_DAYS, today, addDays, msToMidnight, pickDate, setServerTime, isIso, longDate, clock, duration, decode,
    key, load, save, state, status, share, shareBar, manifest, countdown, timer, open, comeBackSoon, archiveDates, now };
});
