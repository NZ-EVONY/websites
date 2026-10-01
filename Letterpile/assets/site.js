/* Letterpile shared layout and UI helpers. Every page includes engine.js then this file. */
(function () {
  "use strict";

  const NAV = [
    { href: "index.html", label: "Word Unscrambler", key: "unscrambler", icon: "U" },
    { href: "word-scrambler.html", label: "Word Scrambler", key: "scrambler", icon: "S" },
    { href: "word-combiner.html", label: "Word Combiner", key: "combiner", icon: "+" },
    { href: "scrabble-word-finder.html", label: "Scrabble Word Finder", key: "scrabble", icon: "Q" },
  ];
  const MORE = [
    { href: "words-with-friends.html", label: "Words With Friends Finder", key: "wwf", icon: "W" },
    { href: "wordle-solver.html", label: "Wordle Solver", key: "wordle", icon: "5" },
    { href: "anagram-solver.html", label: "Anagram Solver", key: "anagram", icon: "A" },
    { href: "jumble-solver.html", label: "Jumble Solver", key: "jumble", icon: "J" },
    { href: "crossword-solver.html", label: "Crossword Solver", key: "crossword", icon: "?" },
    { href: "text-twist-solver.html", label: "Text Twist & Wordscapes", key: "twist", icon: "T" },
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const page = document.body.dataset.page;
  const cur = key => (key === page ? ' aria-current="page"' : "");

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------- chrome ----------

  function renderChrome() {
    const inMore = MORE.some(m => m.key === page);
    document.body.insertAdjacentHTML("afterbegin", `
      <a class="skip" href="#main" style="position:absolute;left:-999px">Skip to content</a>
      <header class="masthead">
        <div class="wrap">
          <button class="menu-toggle" id="menuToggle" type="button" aria-label="Open menu" aria-expanded="false">☰</button>
          <a class="brand" href="index.html"><span class="brand-tiles" aria-hidden="true"><span>L</span><span>P</span><span>!</span></span>Letterpile</a>
          <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle dark mode">◐</button>
        </div>
      </header>
      <nav class="navbar" id="navbar" aria-label="Word tools">
        <ul class="nav-main wrap">
          ${NAV.map(n => `<li><a href="${n.href}"${cur(n.key)}>${n.label}</a></li>`).join("")}
          <li class="has-dropdown" id="moreMenu">
            <button type="button" class="${inMore ? "active" : ""}" aria-haspopup="true" aria-expanded="false">More Word Games<span class="caret"></span></button>
            <ul class="dropdown">
              ${MORE.map(n => `<li><a href="${n.href}"${cur(n.key)}>${n.label}</a></li>`).join("")}
            </ul>
          </li>
        </ul>
      </nav>`);

    const sidebar = $("#sidebar");
    if (sidebar) {
      sidebar.insertAdjacentHTML("afterbegin", `
        <section class="panel">
          <h2>Word tools</h2>
          <ul>${[...NAV, ...MORE].map(n => `<li><a href="${n.href}"${cur(n.key)}><span class="ico">${n.icon}</span>${n.label}</a></li>`).join("")}</ul>
        </section>`);
    }

    document.body.insertAdjacentHTML("beforeend", `
      <footer class="footer">
        <div class="wrap">
          <div class="cols">${[...NAV, ...MORE].map(n => `<a href="${n.href}">${n.label}</a>`).join("")}</div>
          <p>Letterpile is a free word-game helper. Word list: <a href="https://github.com/sindresorhus/word-list" rel="noopener">word-list</a> (MIT). Definitions: <a href="https://dictionaryapi.dev/" rel="noopener">Free Dictionary API</a>. Scrabble® and Words With Friends® are trademarks of their owners; Letterpile isn't affiliated with either.</p>
        </div>
      </footer>
      <dialog class="define" id="defineDialog" aria-labelledby="defineWord">
        <header><h2 id="defineWord"></h2><span class="pts" id="definePts"></span><button type="button" id="defineClose" aria-label="Close">×</button></header>
        <div class="body" id="defineBody"></div>
      </dialog>
      <div class="toast" id="toast" role="status" hidden></div>`);

    // Dropdown: click to toggle (touch), hover on desktop via CSS.
    const more = $("#moreMenu");
    const moreBtn = more.querySelector("button");
    moreBtn.addEventListener("click", e => {
      e.stopPropagation();
      const open = more.classList.toggle("open");
      moreBtn.setAttribute("aria-expanded", open);
    });
    document.addEventListener("click", e => {
      if (!more.contains(e.target)) { more.classList.remove("open"); moreBtn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") { more.classList.remove("open"); moreBtn.setAttribute("aria-expanded", "false"); }
    });

    const menuBtn = $("#menuToggle");
    menuBtn.addEventListener("click", () => {
      const open = $("#navbar").classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
      if (inMore) more.classList.add("open");
    });

    const root = document.documentElement;
    try { const t = localStorage.getItem("theme"); if (t) root.dataset.theme = t; } catch {}
    $("#themeToggle").addEventListener("click", () => {
      const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch {}
    });

    $("#defineClose").addEventListener("click", () => $("#defineDialog").close());
    $("#defineDialog").addEventListener("click", e => { if (e.target.id === "defineDialog") e.target.close(); });
  }

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
    for (let i = 0; i < w.length; i++) letters += marks[i] ? `<span class="blank" title="blank tile">${w[i]}</span>` : w[i];
    const pts = item.score != null ? `<span class="pts">${item.score}</span>` : "";
    const cls = ["word", item.bingo ? "bingo" : "", plain ? "plain" : ""].filter(Boolean).join(" ");
    return `<button type="button" class="${cls}" data-word="${esc(w)}"${scheme ? ` data-scheme="${scheme}"` : ""}${item.bingo ? ' title="Uses all 7 tiles: bingo bonus"' : ""}>${letters}${pts}</button>`;
  }

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

  function showLoading(el, msg = "Loading the dictionary…") {
    el.innerHTML = `<p class="loading">${esc(msg)}</p>`;
  }

  // Run fn once the dictionary is ready, showing a spinner the first time.
  async function withWords(el, fn) {
    if (!Engine.words) showLoading(el);
    try {
      await Engine.load();
      // Yield so the spinner paints before a heavy search.
      await new Promise(r => setTimeout(r, 0));
      fn();
    } catch (e) {
      el.innerHTML = `<p class="error">${esc(e.message)}</p>`;
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

  // ---------- definitions ----------

  const defCache = new Map();
  async function define(word, scheme) {
    const dlg = $("#defineDialog");
    $("#defineWord").textContent = word;
    $("#definePts").textContent = Engine.words
      ? `${Engine.score(word, scheme || "scrabble")} pts ${scheme === "wwf" ? "in Words With Friends" : "in Scrabble"}`
      : "";
    const body = $("#defineBody");
    const links = `<div class="links">
      <a href="https://en.wiktionary.org/wiki/${encodeURIComponent(word)}" target="_blank" rel="noopener">Wiktionary ↗</a>
      <a href="https://www.merriam-webster.com/dictionary/${encodeURIComponent(word)}" target="_blank" rel="noopener">Merriam-Webster ↗</a>
      <button type="button" class="btn secondary" style="padding:4px 12px;font-size:13px" id="copyWord">Copy word</button></div>`;
    body.innerHTML = `<p class="loading">Looking up “${esc(word)}”…</p>`;
    if (!dlg.open) dlg.showModal();

    try {
      if (!defCache.has(word)) {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
        defCache.set(word, res.ok ? await res.json() : []);
      }
      const entries = defCache.get(word);
      const meanings = entries.flatMap(e => e.meanings || []).slice(0, 4);
      body.innerHTML = meanings.length
        ? meanings.map(m => `<p class="pos">${esc(m.partOfSpeech)}</p><ol>${m.definitions.slice(0, 3).map(d => `<li>${esc(d.definition)}</li>`).join("")}</ol>`).join("") + links
        : `<p class="hint">No definition in the free dictionary. It's in our word list, so it may be rare, archaic, or an inflected form.</p>${links}`;
    } catch {
      body.innerHTML = `<p class="hint">Couldn't reach the dictionary service.</p>${links}`;
    }
    $("#copyWord")?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(word); toast("Copied"); } catch { toast("Couldn't copy"); }
    });
  }

  document.addEventListener("click", e => {
    const w = e.target.closest(".word[data-word]");
    if (w) define(w.dataset.word, w.dataset.scheme);
  });

  renderChrome();
  window.UI = { $, esc, chip, renderGroups, withWords, getParams, setParams, toast, define };
})();
