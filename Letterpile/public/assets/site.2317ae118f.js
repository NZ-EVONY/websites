/* Letterpile shared UI behaviour. The header, menus, sidebar, footer and definition
   dialog are in the HTML (rendered at build time); this file only adds behaviour.
   Tool pages include engine.js, then this file, then their own script (all deferred). */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const Engine = window.Engine;

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- header, menus, theme ----------

  const more = $("#moreMenu");
  if (more) {
    const close = () => { more.open = false; };
    document.addEventListener("click", e => { if (!more.contains(e.target)) close(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && more.open) { close(); more.querySelector("summary").focus(); }
    });
  }

  const menuBtn = $("#menuToggle");
  menuBtn?.addEventListener("click", () => {
    const open = $("#navbar").classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  // The theme is applied before first paint by the inline script in <head>.
  const root = document.documentElement;
  const themeBtn = $("#themeToggle");
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const syncTheme = () => themeBtn?.setAttribute("aria-pressed", String(isDark()));
  themeBtn?.addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
    syncTheme();
  });
  syncTheme();

  // ---------- shared UI ----------

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 1600);
  }

  // A word tile. Letters that came from blank tiles are marked.
  function chip(item, { scheme, plain } = {}) {
    const w = typeof item === "string" ? item : item.word;
    const blanks = [...(item.blanks || "")];
    let letters = "";
    // Mark blank letters from the end so real tiles take the earlier positions.
    const marks = new Array(w.length).fill(false);
    for (const b of blanks) {
      for (let i = w.length - 1; i >= 0; i--) if (w[i] === b && !marks[i]) { marks[i] = true; break; }
    }
    for (let i = 0; i < w.length; i++) letters += marks[i] ? `<span class="blank" title="blank tile">${esc(w[i])}</span>` : esc(w[i]);
    const pts = item.score != null ? `<span class="pts">${item.score}</span>` : "";
    const cls = ["word", item.bingo ? "bingo" : "", plain ? "plain" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-word="${esc(w)}"${scheme ? ` data-scheme="${esc(scheme)}"` : ""}${item.bingo ? ' title="Uses all 7 tiles: all-tiles bonus"' : ""}>${letters}${pts}</button>`;
  }

  // A non-clickable word or phrase (blends, two-word anagrams).
  const plainWord = s => `<span class="word plain static">${esc(s)}</span>`;

  // Group results by word length, longest first, with a cap per group. Accepts a flat list,
  // or the { total, groups } shape from Engine.unscrambleGrouped (already grouped and trimmed).
  const byWord = (a, b) => { const x = a.word || a, y = b.word || b; return x < y ? -1 : x > y ? 1 : 0; };
  function renderGroups(items, { perGroup = 200, scheme, sort = "alpha", label = n => `${n}-letter words` } = {}) {
    let groups;
    if (items.groups) groups = items.groups.map(g => [g.n, g.items, g.count]);
    else {
      const m = new Map();
      for (const it of items) {
        const n = (it.word || it).length;
        if (!m.has(n)) m.set(n, []);
        m.get(n).push(it);
      }
      groups = [...m.entries()].sort((a, b) => b[0] - a[0]).map(([n, list]) => {
        if (sort === "alpha") list.sort(byWord);
        return [n, list.slice(0, perGroup), list.length];
      });
    }
    return groups.map(([n, shown, count]) => {
      const extra = count - shown.length;
      return `<section class="group" data-len="${n}"><h3>${label(n)} <span class="count">${count}</span></h3>
        <div class="words">${shown.map(it => chip(it, { scheme })).join("")}</div>
        ${extra > 0 ? `<p class="hint more">…and ${extra} more. Narrow it down with the filters.</p>` : ""}</section>`;
    }).join("");
  }

  function showLoading(el, msg = "Loading the word list…") {
    el.innerHTML = `<p class="loading">${esc(msg)}</p>`;
  }

  // ---------- searches (in a Web Worker when possible) ----------

  // Searches run in a worker so long ones never freeze the page. The worker loads the same
  // engine.js and word file; if workers aren't available, the engine runs here instead.
  const engineEl = document.querySelector("script[data-worker]");
  let worker = null, workerReady = false, seq = 0;
  const pending = new Map();
  function startWorker() {
    if (worker || !engineEl || !("Worker" in window)) return worker;
    try {
      worker = new Worker(engineEl.dataset.worker);
      worker.onmessage = e => {
        const p = pending.get(e.data.id);
        if (!p) return;
        pending.delete(e.data.id);
        workerReady = true;
        e.data.error ? p.reject(new Error(e.data.error)) : p.resolve(e.data.result);
      };
      worker.onerror = () => { for (const p of pending.values()) p.reject(new Error("Couldn't load the word list.")); pending.clear(); worker = null; };
      const abs = u => new URL(u, location.href).href;
      worker.postMessage({ type: "init", engine: abs(engineEl.src), words: abs(engineEl.dataset.words) });
    } catch { worker = null; }
    return worker;
  }
  function compute(fn, ...args) {
    const w = startWorker();
    if (!w) return Engine.load().then(() => Engine[fn](...args));
    return new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      w.postMessage({ id, fn, args, showAll: Engine.showAll });
    });
  }
  const isReady = () => workerReady || !!Engine?.words;

  // Run an (async) search, showing a spinner while the word list loads the first time.
  // fn receives current(): false once a newer search has started on the same element,
  // so a slow, older result never overwrites a newer one.
  async function withWords(el, fn) {
    const tok = (el._searchToken = (el._searchToken || 0) + 1);
    const current = () => el._searchToken === tok;
    if (!isReady()) showLoading(el);
    try {
      await fn(current);
    } catch (e) {
      if (current()) el.innerHTML = `<p class="error">${esc(e.message)} Check your connection and try again.</p>`;
    }
  }

  // Query-string state so results can be bookmarked and shared.
  function getParams() { return Object.fromEntries(new URLSearchParams(location.search)); }
  function setParams(obj) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(obj)) if (v !== "" && v != null && v !== false) p.set(k, v === true ? "1" : v);
    const qs = p.toString();
    history.replaceState(null, "", qs ? `?${qs}` : location.pathname);
  }

  // Keep only letters (and blank symbols when allowed) as the visitor types.
  function letterInput(el, { blanks = true, max } = {}) {
    if (!el) return;
    const bad = blanks ? /[^A-Za-z?*_\s]/g : /[^A-Za-z\s]/g;
    el.addEventListener("input", () => {
      if (bad.test(el.value)) {
        const pos = el.selectionStart - (el.value.slice(0, el.selectionStart).match(bad) || []).length;
        el.value = el.value.replace(bad, "");
        try { el.setSelectionRange(pos, pos); } catch {}
      }
      bad.lastIndex = 0;
    });
    if (max) el.maxLength = max;
  }

  // Start fetching the word list as soon as someone starts using a tool form,
  // rather than on page load (keeps the first paint light).
  if (Engine) {
    const warm = () => { compute("isWord", "a").catch(() => {}); };
    document.querySelectorAll(".tool-form, [data-warm]").forEach(f => {
      ["pointerdown", "keydown", "input"].forEach(t => f.addEventListener(t, warm, { once: true, passive: true }));
    });
  }

  // ---------- tile rack preview (decorative) ----------

  // Mirrors the letters typed into a tool's main input as tiles with their point values.
  // aria-hidden: screen readers already have the input itself. Ghost tiles show free slots.
  const TILE_COLORS = ["coral", "sun", "mint", "blue", "violet"];
  document.querySelectorAll("[data-rack-for]").forEach(rack => {
    const input = document.getElementById(rack.dataset.rackFor);
    if (!input) return;
    const slots = Number(rack.dataset.slots) || 0;
    const scheme = Engine?.SCHEMES?.[document.body.dataset.scheme] || Engine?.SCHEMES?.scrabble;
    let shown = "";
    const draw = animate => {
      const v = input.value.toLowerCase().replace(/[*_]/g, "?").replace(/[^a-z?]/g, "").slice(0, 18);
      const tiles = [...v].map((ch, i) => {
        const t = document.createElement("span");
        if (ch === "?") { t.className = "tile blank"; t.textContent = "?"; }
        else {
          t.className = `tile c-${TILE_COLORS[(ch.charCodeAt(0) - 97) % TILE_COLORS.length]}`;
          t.textContent = ch;
          const pts = scheme?.values?.[ch];
          if (pts != null) { const sup = document.createElement("sup"); sup.textContent = pts; t.append(sup); }
        }
        if (animate && i >= shown.length) t.classList.add("pop");
        return t;
      });
      for (let n = v.length; n < slots; n++) { const g = document.createElement("span"); g.className = "tile ghost"; tiles.push(g); }
      rack.replaceChildren(...tiles);
      shown = v;
    };
    input.addEventListener("input", () => draw(true));
    // Shared links fill the input from the address without an input event.
    input.form?.addEventListener("submit", () => draw(false));
    addEventListener("pageshow", () => draw(false));
  });

  // ---------- "show all words" toggle ----------

  const filterListeners = [];
  function onWordsFilter(fn) { filterListeners.push(fn); }
  if (Engine) {
    let showAll = false;
    try { showAll = localStorage.getItem("showAll") === "1"; } catch {}
    Engine.setShowAll(showAll);
    document.querySelectorAll("[data-show-all]").forEach(box => {
      box.checked = showAll;
      box.addEventListener("change", () => {
        Engine.setShowAll(box.checked);
        try { localStorage.setItem("showAll", box.checked ? "1" : "0"); } catch {}
        document.querySelectorAll("[data-show-all]").forEach(b => { b.checked = box.checked; });
        if (isReady()) filterListeners.forEach(fn => fn());
      });
    });
  }

  // ---------- definitions ----------

  const SCHEME_LABEL = { scrabble: "commonly used tile values", wwf: "commonly used Words With Friends values" };
  const defCache = new Map();
  let current = "";

  function el(tag, attrs = {}, text) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    if (text != null) n.textContent = text;
    return n;
  }

  function showDefinitions(entries) {
    const out = $("#defineResult");
    out.replaceChildren();
    const meanings = entries.flatMap(e => e.meanings || []).slice(0, 4);
    if (!meanings.length) {
      out.append(el("p", { class: "hint" }, "No definition found in the Free Dictionary. The word is in the ENABLE word list, so it may be rare, old-fashioned or an inflected form. Try the links below."));
      return;
    }
    for (const m of meanings) {
      out.append(el("p", { class: "pos" }, m.partOfSpeech || ""));
      const ol = el("ol");
      for (const d of (m.definitions || []).slice(0, 3)) ol.append(el("li", {}, d.definition || ""));
      out.append(ol);
    }
  }

  async function lookUp() {
    const word = current;
    const btn = $("#defineLookup");
    const out = $("#defineResult");
    btn.disabled = true;
    out.replaceChildren(el("p", { class: "loading" }, `Looking up “${word}”…`));
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { referrerPolicy: "no-referrer", credentials: "omit" });
      if (word !== current) return;
      if (res.status === 404) { defCache.set(word, []); showDefinitions([]); btn.hidden = true; return; }
      if (res.status === 429) { out.replaceChildren(el("p", { class: "hint" }, "The dictionary service is busy right now. Please wait a minute and try again.")); return; }
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      defCache.set(word, Array.isArray(data) ? data : []);
      showDefinitions(defCache.get(word));
      btn.hidden = true;
    } catch {
      if (word === current) out.replaceChildren(el("p", { class: "hint" }, "Couldn't reach the dictionary service. Check your connection, or use the links below."));
    } finally {
      btn.disabled = false;
    }
  }

  function define(word, scheme) {
    const dlg = $("#defineDialog");
    if (!dlg) return;
    current = word;
    $("#defineWord").textContent = word;
    const s = Engine?.SCHEMES[scheme] ? scheme : "scrabble";
    $("#definePts").textContent = Engine ? `${Engine.score(word, s)} points (${SCHEME_LABEL[s]})` : "";
    $("#defineWiktionary").href = `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}`;
    $("#defineMW").href = `https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}`;
    const btn = $("#defineLookup");
    if (defCache.has(word)) { showDefinitions(defCache.get(word)); btn.hidden = true; }
    else { $("#defineResult").replaceChildren(); btn.hidden = false; }
    if (!dlg.open) dlg.showModal();
  }

  const dlg = $("#defineDialog");
  if (dlg) {
    $("#defineClose").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
    $("#defineLookup").addEventListener("click", lookUp);
    $("#copyWord").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(current); toast("Copied"); } catch { toast("Couldn't copy"); }
    });
  }

  document.addEventListener("click", e => {
    const w = e.target.closest(".word[data-word]");
    if (w) define(w.dataset.word, w.dataset.scheme);
  });

  window.UI = { $, esc, chip, plainWord, renderGroups, withWords, compute, isReady, getParams, setParams, toast, define, letterInput, onWordsFilter };
})();
