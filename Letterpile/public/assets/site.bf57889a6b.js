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

  // Group results by word length, longest first, with a cap per group.
  function renderGroups(items, { perGroup = 200, scheme, sort = "alpha", label = n => `${n}-letter words` } = {}) {
    const groups = new Map();
    for (const it of items) {
      const n = (it.word || it).length;
      if (!groups.has(n)) groups.set(n, []);
      groups.get(n).push(it);
    }
    return [...groups.entries()].sort((a, b) => b[0] - a[0]).map(([n, list]) => {
      if (sort === "alpha") list.sort((a, b) => (a.word || a).localeCompare(b.word || b));
      const shown = list.slice(0, perGroup);
      const extra = list.length - shown.length;
      return `<section class="group"><h3>${label(n)} <span class="count">${list.length}</span></h3>
        <div class="words">${shown.map(it => chip(it, { scheme })).join("")}</div>
        ${extra > 0 ? `<p class="hint more">…and ${extra} more. Narrow it down with the filters.</p>` : ""}</section>`;
    }).join("");
  }

  function showLoading(el, msg = "Loading the word list…") {
    el.innerHTML = `<p class="loading">${esc(msg)}</p>`;
  }

  // Run fn once the word list is ready, showing a spinner the first time.
  async function withWords(el, fn) {
    if (!Engine.words) showLoading(el);
    try {
      await Engine.load();
      // Yield so the spinner paints before a heavy search.
      await new Promise(r => setTimeout(r, 0));
      fn();
    } catch (e) {
      el.innerHTML = `<p class="error">${esc(e.message)} Check your connection and try again.</p>`;
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
    const warm = () => { Engine.load().catch(() => {}); };
    document.querySelectorAll(".tool-form, [data-warm]").forEach(f => {
      ["pointerdown", "keydown", "input"].forEach(t => f.addEventListener(t, warm, { once: true, passive: true }));
    });
  }

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
        if (Engine.words) filterListeners.forEach(fn => fn());
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

  window.UI = { $, esc, chip, plainWord, renderGroups, withWords, getParams, setParams, toast, define, letterInput, onWordsFilter };
})();
