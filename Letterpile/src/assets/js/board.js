/* Board Solver: a 15x15 board you fill in, plus your rack. Finds the highest-scoring plays (in
   js/tools-worker.js) and previews them on the board. */
(function () {
  "use strict";
  const { $, esc, getParams, setParams, letterInput } = UI;
  const T = WordToolsClient;
  const N = 15, COLS = "ABCDEFGHIJKLMNO";
  const boardEl = $("#board"), out = $("#results"), emptyHtml = out.innerHTML;
  const LABEL = { d: "DL", t: "TL", D: "DW", T: "TW" }, CYCLE = { ".": "d", d: "t", t: "D", D: "T", T: "." };
  const NAMES = { d: "double letter", t: "triple letter", D: "double word", T: "triple word" };
  let cells = Array(N * N).fill("."), bonus = boardEl.dataset.classic.split(""), across = true, plays = [], shown = -1;
  letterInput($("#rack"), { blanks: true, max: 7 });

  // ---------- drawing ----------
  boardEl.innerHTML = Array.from({ length: N * N }, (_, i) => `<input type="text" class="bs-cell" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false" data-i="${i}">`).join("");
  const inputs = [...boardEl.children];
  function draw() {
    const preview = shown >= 0 ? new Map(plays[shown].tiles.map(([r, c, ch, b]) => [r * N + c, b ? ch.toUpperCase() : ch])) : new Map();
    inputs.forEach((el, i) => {
      const t = preview.get(i) || cells[i], b = bonus[i];
      el.value = t === "." ? "" : t.toUpperCase();
      el.placeholder = i === 112 && b === "D" ? "★" : LABEL[b] || "";
      el.dataset.b = b;
      el.classList.toggle("blank", t !== "." && t === t.toUpperCase());
      el.classList.toggle("new", preview.has(i));
      el.setAttribute("aria-label", `${COLS[i % N]}${Math.floor(i / N) + 1}${b !== "." ? `, ${NAMES[b]}` : ""}${t !== "." ? `: ${t.toUpperCase()}${t === t.toUpperCase() ? " (blank)" : ""}` : ", empty"}`);
    });
    save();
  }
  function save() {
    const b = cells.join(""), x = bonus.join("") === boardEl.dataset.classic ? "" : bonus.join("");
    setParams({ b: /[a-z]/i.test(b) ? b.replace(/\.+$/, "") : "", r: $("#rack").value, v: $("#values").value === "wwf" ? "wwf" : "", x });
  }

  // ---------- editing the board ----------
  const editingBonus = () => $("#editBonus").checked;
  boardEl.addEventListener("input", e => {
    const el = e.target, i = +el.dataset.i;
    if (editingBonus()) { draw(); return; }
    const ch = el.value.toLowerCase().replace(/[^a-z]/g, "").slice(-1);
    shown = -1;
    cells[i] = ch || ".";
    draw();
    if (ch) { const j = across ? (i % N < N - 1 ? i + 1 : i) : (i + N < N * N ? i + N : i); inputs[j].focus(); inputs[j].select(); }
  });
  boardEl.addEventListener("click", e => {
    const el = e.target.closest(".bs-cell");
    if (!el || !editingBonus()) return;
    const i = +el.dataset.i;
    bonus[i] = CYCLE[bonus[i]];
    draw();
  });
  boardEl.addEventListener("keydown", e => {
    const i = +e.target.dataset.i;
    const go = j => { if (j >= 0 && j < N * N) { e.preventDefault(); inputs[j].focus(); inputs[j].select(); } };
    if (e.key === "Backspace" && !e.target.value) go(across ? i - 1 : i - N);
    else if (e.key === "ArrowRight") go(i + 1); else if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "ArrowDown") go(i + N); else if (e.key === "ArrowUp") go(i - N);
    else if (e.key === " ") { e.preventDefault(); toggleDir(); }
  });
  let last = 112;
  boardEl.addEventListener("focusin", e => { if (e.target.dataset.i) last = +e.target.dataset.i; });
  const toggleDir = () => { across = !across; $("#dir").textContent = `Typing: ${across ? "across →" : "down ↓"}`; };
  $("#dir").addEventListener("click", toggleDir);
  $("#blank").addEventListener("click", () => {
    const t = cells[last];
    if (t === ".") { UI.toast("Select a square with a tile first"); return; }
    cells[last] = t === t.toUpperCase() ? t.toLowerCase() : t.toUpperCase();
    shown = -1; draw(); inputs[last].focus();
  });
  $("#clearBoard").addEventListener("click", () => { cells = Array(N * N).fill("."); shown = -1; plays = []; out.innerHTML = emptyHtml; draw(); });
  $("#resetBonus").addEventListener("click", () => { bonus = boardEl.dataset.classic.split(""); draw(); });
  $("#editBonus").addEventListener("change", () => { boardEl.classList.toggle("editing", editingBonus()); inputs.forEach(el => { el.readOnly = editingBonus(); }); });

  // ---------- solving ----------
  const where = p => `${p.across ? `${p.row + 1}${COLS[p.col]}` : `${COLS[p.col]}${p.row + 1}`} ${p.across ? "across" : "down"}`;
  function solve() {
    const rack = $("#rack").value.toLowerCase().replace(/[^a-z?]/g, "");
    if (!rack) { out.innerHTML = emptyHtml; return; }
    shown = -1; draw();
    const wwf = $("#values").value === "wwf";
    const values = JSON.parse(boardEl.dataset[wwf ? "wwf" : "classicValues"]);
    T.run(out, async current => {
      plays = await T.compute("board", cells.join(""), bonus.join(""), rack, { values, bingo: wwf ? 35 : 50, limit: 40 });
      if (!current()) return;
      if (!plays.length) { out.innerHTML = `<p class="empty">No legal play found with these tiles. Check the board: a play must touch a tile already there (or cover the center ★ on the first move).</p>`; return; }
      out.innerHTML = `<p class="summary">Top ${plays.length} plays. <small>Tap one to see it on the board.</small></p><ol class="bs-plays">${plays.map((p, i) => `<li><button type="button" class="bs-play" data-i="${i}"><b>${esc(p.word.toUpperCase())}</b> <span>${where(p)}</span> <strong>${p.score}</strong>${p.words.length > 1 ? `<small>also ${p.words.slice(1).map(w => esc(w.toUpperCase())).join(", ")}</small>` : ""}${p.tiles.length === 7 ? `<small>all 7 tiles</small>` : ""}</button></li>`).join("")}</ol>`;
      show(0);
    });
  }
  function show(i) {
    shown = i;
    out.querySelectorAll(".bs-play").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.i === i)));
    draw();
    $("#playIt").hidden = false;
    $("#preview").textContent = `Showing ${plays[i].word.toUpperCase()} at ${where(plays[i])} for ${plays[i].score} points.`;
  }
  out.addEventListener("click", e => { const b = e.target.closest(".bs-play"); if (b) show(+b.dataset.i); });
  // Put the shown play on the board and take its tiles off the rack.
  $("#playIt").addEventListener("click", () => {
    if (shown < 0) return;
    let rack = $("#rack").value.toLowerCase();
    for (const [r, c, ch, b] of plays[shown].tiles) { cells[r * N + c] = b ? ch.toUpperCase() : ch; rack = rack.replace(b ? "?" : ch, ""); }
    $("#rack").value = rack.toUpperCase();
    $("#rack").dispatchEvent(new Event("input", { bubbles: true }));
    shown = -1; plays = []; $("#playIt").hidden = true; $("#preview").textContent = "";
    out.innerHTML = emptyHtml; draw();
  });
  $("#form").addEventListener("submit", e => { e.preventDefault(); solve(); });
  $("#values").addEventListener("change", () => { save(); if (plays.length) solve(); });
  T.onFilter(() => { if (plays.length) solve(); });

  const q = getParams();
  if (q.b) [...q.b.slice(0, N * N)].forEach((ch, i) => { cells[i] = /[a-z]/i.test(ch) ? ch : "."; });
  if (q.x && q.x.length === N * N) bonus = q.x.split("").map(ch => (LABEL[ch] ? ch : "."));
  if (q.v === "wwf") $("#values").value = "wwf";
  if (q.r) $("#rack").value = q.r;
  draw();
  if (q.r) solve();
})();
