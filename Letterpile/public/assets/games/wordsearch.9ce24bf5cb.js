(function () {
  "use strict";
  const G = window.Games, $ = s => document.querySelector(s);
  const gridEl = $("#wsGrid");
  if (!G || !gridEl) return;
  const msg = $("#wsMsg"), list = $("#wsWords"), count = $("#wsCount");
  const N = 20, COLORS = 5;
  let date, puzzle, st, timer, cells = [], start = null, end = null, cursor = 0, dragging = false, moved = false;

  const rc = i => [Math.floor(i / N), i % N];
  function line(a, b) {
    const [r1, c1] = rc(a), [r2, c2] = rc(b);
    let dr = r2 - r1, dc = c2 - c1;
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (!len) return [a];
    const ang = Math.round(Math.atan2(dr, dc) / (Math.PI / 4));
    const sr = Math.round(Math.sin(ang * Math.PI / 4)), sc = Math.round(Math.cos(ang * Math.PI / 4));
    const out = [];
    for (let k = 0; k <= len; k++) {
      const r = r1 + sr * k, c = c1 + sc * k;
      if (r < 0 || r >= N || c < 0 || c >= N) break;
      out.push(r * N + c);
    }
    return out;
  }
  const lettersOf = w => w.replace(/ /g, "").toLowerCase();
  const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
  const cellsOf = w => { const [dr, dc] = DIRS[w.d]; return [...lettersOf(w.w)].map((_, k) => (w.r + dr * k) * N + w.c + dc * k); };

  function paint() {
    const sel = start != null ? new Set(line(start, end ?? start)) : new Set();
    const color = new Map();
    puzzle.words.forEach((w, n) => { if (st.found.includes(w.w)) cellsOf(w).forEach(i => color.set(i, n % COLORS)); });
    cells.forEach((el, i) => {
      el.className = "ws-cell" + (color.has(i) ? ` f${color.get(i)}` : "") + (sel.has(i) ? " sel" : "") + (i === cursor && document.activeElement === gridEl ? " cur" : "");
    });
    list.querySelectorAll("li").forEach(li => {
      const f = st.found.includes(li.dataset.w);
      li.classList.toggle("found", f);
      li.querySelector(".sr-only").textContent = f ? " (found)" : "";
    });
    count.textContent = `${st.found.length} / ${puzzle.words.length}`;
  }

  function finishSelection() {
    if (start == null) return;
    const sel = line(start, end ?? start);
    start = end = null;
    const s = sel.map(i => puzzle.grid[i]).join("");
    const hit = puzzle.words.find(w => !st.found.includes(w.w) && (lettersOf(w.w) === s || lettersOf(w.w) === [...s].reverse().join("")) && sameCells(cellsOf(w), sel));
    if (hit) {
      st.found.push(hit.w);
      msg.textContent = `Found ${hit.w}! ${puzzle.words.length - st.found.length} to go.`;
      if (st.found.length === puzzle.words.length) win();
      save();
    } else if (sel.length > 1) msg.textContent = puzzle.words.some(w => st.found.includes(w.w) && sameCells(cellsOf(w), sel)) ? "You've already found that one." : "Not a word on the list. Try again.";
    paint();
  }
  const sameCells = (a, b) => a.length === b.length && a.every(i => b.includes(i));

  function win() {
    st.done = true;
    timer.stop();
    st.t = timer.elapsed();
    msg.textContent = `All ${puzzle.words.length} words found in ${G.duration(st.t)}.`;
    $("#wsDoneText").textContent = `You found every ${puzzle.theme} word for ${G.longDate(date)} in ${G.duration(st.t)}.`;
    $("#wsDone").hidden = false;
  }
  const save = () => { st.t = timer ? timer.elapsed() : st.t; G.save(G.key("wordsearch", date), st); };


  const cellAt = e => { const el = document.elementFromPoint(e.clientX, e.clientY); return el?.classList.contains("ws-cell") ? +el.dataset.i : null; };
  gridEl.addEventListener("pointerdown", e => {
    if (st?.done) return;
    const i = cellAt(e);
    if (i == null) return;
    if (start != null && !dragging) {
      if (i === start) { start = end = null; msg.textContent = "Selection cancelled."; paint(); return; }
      end = i; finishSelection(); return;
    }
    start = end = i; dragging = true; moved = false;
    if (!gridEl.classList.contains("zoomed")) gridEl.setPointerCapture?.(e.pointerId);
    paint();
  });
  gridEl.addEventListener("pointermove", e => {
    if (!dragging || start == null) return;
    const i = cellAt(e);
    if (i != null && i !== end) { end = i; moved = moved || i !== start; paint(); }
  });
  const up = () => {
    if (!dragging) return;
    dragging = false;
    if (moved) finishSelection();
    else msg.textContent = "Now tap the last letter of the word.";
  };
  gridEl.addEventListener("pointerup", up);
  gridEl.addEventListener("pointercancel", () => { dragging = false; });


  gridEl.addEventListener("keydown", e => {
    const mv = { ArrowUp: -N, ArrowDown: N, ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (mv) {
      e.preventDefault();
      const [r, c] = rc(cursor);
      if ((e.key === "ArrowLeft" && c === 0) || (e.key === "ArrowRight" && c === N - 1) || (e.key === "ArrowUp" && r === 0) || (e.key === "ArrowDown" && r === N - 1)) return;
      cursor += mv;
      if (start != null) end = cursor;
      const [r2, c2] = rc(cursor);
      msg.textContent = `Row ${r2 + 1}, column ${c2 + 1}: ${puzzle.grid[cursor].toUpperCase()}${start != null ? `. Selected: ${line(start, end).map(i => puzzle.grid[i]).join("").toUpperCase()}` : ""}`;
      paint();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (st.done) return;
      if (start == null) { start = end = cursor; msg.textContent = `Started at ${puzzle.grid[cursor].toUpperCase()}. Move to the last letter and press Enter.`; paint(); }
      else { end = cursor; finishSelection(); }
    } else if (e.key === "Escape" && start != null) { start = end = null; msg.textContent = "Selection cancelled."; paint(); }
  });
  gridEl.addEventListener("focus", paint);
  gridEl.addEventListener("blur", paint);

  $("#wsZoom").addEventListener("click", e => {
    const on = gridEl.classList.toggle("zoomed");
    $("#wsWrap").classList.toggle("zoomed", on);
    e.currentTarget.setAttribute("aria-pressed", String(on));
    e.currentTarget.textContent = on ? "Zoom out" : "Zoom in";
  });
  G.shareBar($("#wsDone [data-share]"), () => (`Letterpile Daily Word Search #${puzzle.number}: ${puzzle.theme}\nFound all ${puzzle.words.length} words in ${G.duration(st.t)}\nletterpile.app/games/wordsearch`), "/games/wordsearch");

  G.open("wordsearch").then(res => {
    date = res.date;
    if (!res.puzzle) { G.comeBackSoon($(".ws-game")); return; }
    puzzle = res.puzzle;
    st = G.state("wordsearch", date) || { found: [], t: 0, done: false };
    st.found = st.found.filter(w => puzzle.words.some(x => x.w === w));
    $("#wsTheme").textContent = `Today's theme: ${puzzle.theme}`;
    gridEl.innerHTML = [...puzzle.grid].map((ch, i) => `<span class="ws-cell" data-i="${i}">${ch}</span>`).join("");
    cells = [...gridEl.children];
    list.innerHTML = puzzle.words.map(w => `<li data-w="${w.w}">${w.w}<span class="sr-only"></span></li>`).join("");
    timer = G.timer($("#wsTimer"), st.t || 0, s => { if (s % 5 === 0 && !st.done) save(); });
    paint();
    if (st.done) win();
    else { timer.start(); msg.textContent = `Find ${puzzle.words.length} words.`; }
    document.getElementById("game").dataset.ready = "1";
  });
})();
