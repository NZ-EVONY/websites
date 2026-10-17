(function () {
  "use strict";
  const G = window.Games, $ = s => document.querySelector(s);
  const gridEl = $("#cwGrid");
  if (!G || !gridEl) return;
  const N = 15;
  const input = $("#cwInput"), msg = $("#cwMsg"), bar = $("#cwClue");
  let date, puzzle, sol, st, timer, cells = [], entries = [], sel = 0, dir = "A";

  const white = i => puzzle.pattern[i] !== "#";
  const save = () => { st.t = timer ? timer.elapsed() : st.t; G.save(G.key("crossword", date), st); };

  function build() {
    entries = [...puzzle.across.map(e => ({ ...e, dir: "A" })), ...puzzle.down.map(e => ({ ...e, dir: "D" }))].map(e => ({
      ...e, cells: [...Array(e.len).keys()].map(k => (e.dir === "A" ? e.r * N + e.c + k : (e.r + k) * N + e.c)),
    }));
    const num = new Map(entries.map(e => [e.r * N + e.c, e.n]));
    let html = "";
    for (let r = 0; r < N; r++) {
      html += `<div class="cw-row" role="row">`;
      for (let c = 0; c < N; c++) {
        const i = r * N + c;
        html += white(i)
          ? `<div class="cw-cell" role="gridcell" data-i="${i}">${num.has(i) ? `<span class="n">${num.get(i)}</span>` : ""}<span class="l"></span></div>`
          : `<div class="cw-cell blk" role="gridcell" aria-label="black square"></div>`;
      }
      html += `</div>`;
    }
    gridEl.innerHTML = html;
    cells = [...gridEl.querySelectorAll(".cw-cell")];
    const li = e => `<li data-k="${e.dir}${e.n}"><b>${e.n}</b> ${G.esc ? G.esc(e.clue) : e.clue.replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]))}</li>`;
    $("#cwAcross").innerHTML = entries.filter(e => e.dir === "A").map(li).join("");
    $("#cwDown").innerHTML = entries.filter(e => e.dir === "D").map(li).join("");
  }

  const entryAt = (i, d) => entries.find(e => e.dir === d && e.cells.includes(i));
  const current = () => entryAt(sel, dir) || entryAt(sel, dir === "A" ? "D" : "A");

  function paint() {
    const cur = current();
    if (cur && cur.dir !== dir) dir = cur.dir;
    const other = entryAt(sel, dir === "A" ? "D" : "A");
    const inWord = new Set(cur ? cur.cells : []);
    cells.forEach(el => {
      if (el.classList.contains("blk")) return;
      const i = +el.dataset.i;
      el.querySelector(".l").textContent = st.l[i] || "";
      el.classList.toggle("sel", i === sel);
      el.classList.toggle("inword", inWord.has(i) && i !== sel);
      el.classList.toggle("bad", st.bad.includes(i) && !!st.l[i]);
      el.classList.toggle("rev", st.rev.includes(i));
      const e = entryAt(i, "A"), d = entryAt(i, "D");
      el.setAttribute("aria-label", `${e ? e.n + " across" : ""}${e && d ? ", " : ""}${d ? d.n + " down" : ""}: ${st.l[i] ? st.l[i].toUpperCase() : "empty"}${st.bad.includes(i) && st.l[i] ? ", wrong" : ""}${st.rev.includes(i) ? ", revealed" : ""}`);
    });
    document.querySelectorAll(".cw-clues li").forEach(li => {
      li.classList.toggle("on", !!cur && li.dataset.k === cur.dir + cur.n);
      li.classList.toggle("cross", !!other && li.dataset.k === other.dir + other.n);
    });
    if (cur) {
      bar.querySelector("b").textContent = `${cur.n} ${cur.dir === "A" ? "Across" : "Down"}`;
      bar.querySelector("span").textContent = cur.clue;
      const on = document.querySelector(".cw-clues li.on");
      if (on && window.matchMedia("(min-width: 900px)").matches) on.scrollIntoView({ block: "nearest" });
    }
  }

  function select(i, d) {
    if (!white(i)) return;
    if (d) dir = d;
    else if (i === sel) dir = dir === "A" ? "D" : "A";
    sel = i;
    if (!entryAt(sel, dir)) dir = dir === "A" ? "D" : "A";
    paint();
  }
  const focusInput = () => { input.focus({ preventScroll: true }); };

  function step(delta) {
    const e = current();
    if (!e) return;
    const k = e.cells.indexOf(sel) + delta;
    if (k >= 0 && k < e.cells.length) sel = e.cells[k];
  }
  function nextEmptyInWord() {
    const e = current();
    const k = e.cells.indexOf(sel);
    const after = e.cells.slice(k + 1).find(i => !st.l[i]);
    if (after != null) sel = after; else step(1);
  }
  function type(ch) {
    if (st.done) return;
    if (st.rev.includes(sel)) { nextEmptyInWord(); paint(); return; }
    st.l[sel] = ch;
    st.bad = st.bad.filter(i => i !== sel);
    nextEmptyInWord();
    after();
  }
  function erase() {
    if (st.done) return;
    if (st.l[sel] && !st.rev.includes(sel)) st.l[sel] = "";
    else { step(-1); if (!st.rev.includes(sel)) st.l[sel] = ""; }
    st.bad = st.bad.filter(i => i !== sel);
    after();
  }
  function jumpClue(delta) {
    const order = [...entries.filter(e => e.dir === "A"), ...entries.filter(e => e.dir === "D")];
    const cur = current();
    const k = (order.findIndex(e => e === cur) + delta + order.length) % order.length;
    const e = order[k];
    dir = e.dir;
    sel = e.cells.find(i => !st.l[i]) ?? e.cells[0];
    paint();
  }
  function move(dr, dc) {
    let r = Math.floor(sel / N), c = sel % N;
    const want = dr ? "D" : "A";
    if (dir !== want) { dir = want; if (entryAt(sel, dir)) { paint(); return; } }
    for (;;) {
      r += dr; c += dc;
      if (r < 0 || r >= N || c < 0 || c >= N) return;
      if (white(r * N + c)) { sel = r * N + c; break; }
    }
    paint();
  }

  function after() {
    paint();
    if (st.l.every((ch, i) => !white(i) || ch === sol[i])) win();
    save();
  }
  function win() {
    if (!st.done) { st.done = true; st.won = true; }
    timer.stop();
    st.t = timer.elapsed();
    const help = st.rev.length ? ` with ${st.rev.length} revealed square${st.rev.length === 1 ? "" : "s"}` : "";
    msg.textContent = `Solved in ${G.duration(st.t)}${help}.`;
    $("#cwDoneText").textContent = `You finished the crossword for ${G.longDate(date)} in ${G.duration(st.t)}${help}.`;
    $("#cwDone").hidden = false;
    gridEl.classList.add("solved");
  }

  function act(a) {
    if (st.done && !a.startsWith("check")) return;
    const [kind, scope] = a.split("-");
    const set = scope === "cell" ? [sel] : scope === "word" ? current().cells : cells.filter(el => !el.classList.contains("blk")).map(el => +el.dataset.i);
    if (kind === "check") {
      const wrong = set.filter(i => st.l[i] && st.l[i] !== sol[i]);
      st.bad = [...new Set([...st.bad.filter(i => !set.includes(i)), ...wrong])];
      msg.textContent = wrong.length ? `${wrong.length} wrong letter${wrong.length === 1 ? "" : "s"} marked in red.` : set.some(i => !st.l[i]) ? "No mistakes so far." : "All correct!";
    } else {
      for (const i of set) if (st.l[i] !== sol[i]) { st.l[i] = sol[i]; if (!st.rev.includes(i)) st.rev.push(i); }
      st.bad = st.bad.filter(i => !set.includes(i));
      msg.textContent = scope === "all" ? "Puzzle revealed." : "Revealed.";
    }
    document.querySelectorAll(".cw-menu[open]").forEach(d => { d.open = false; });
    after();
    focusInput();
  }
  document.querySelectorAll("[data-act]").forEach(b => b.addEventListener("click", () => act(b.dataset.act)));


  gridEl.addEventListener("click", e => { const c = e.target.closest(".cw-cell:not(.blk)"); if (c) { select(+c.dataset.i); focusInput(); } });
  document.querySelector(".cw-lists").addEventListener("click", e => {
    const li = e.target.closest("li[data-k]");
    if (!li) return;
    const en = entries.find(x => x.dir + x.n === li.dataset.k);
    dir = en.dir; sel = en.cells.find(i => !st.l[i]) ?? en.cells[0];
    paint(); focusInput();
  });
  $("#cwPrev").addEventListener("click", () => { jumpClue(-1); focusInput(); });
  $("#cwNext").addEventListener("click", () => { jumpClue(1); focusInput(); });
  input.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (/^[a-zA-Z]$/.test(k)) { e.preventDefault(); type(k.toLowerCase()); }
    else if (k === "Backspace" || k === "Delete") { e.preventDefault(); erase(); }
    else if (k === "ArrowLeft") { e.preventDefault(); move(0, -1); }
    else if (k === "ArrowRight") { e.preventDefault(); move(0, 1); }
    else if (k === "ArrowUp") { e.preventDefault(); move(-1, 0); }
    else if (k === "ArrowDown") { e.preventDefault(); move(1, 0); }
    else if (k === " ") { e.preventDefault(); select(sel); }
    else if (k === "Tab" || k === "Enter") { e.preventDefault(); jumpClue(e.shiftKey ? -1 : 1); }
  });
  input.addEventListener("input", () => {
    const v = input.value.replace(/[^a-z]/gi, "");
    input.value = "";
    if (v) type(v.slice(-1).toLowerCase());
  });
  input.addEventListener("beforeinput", e => { if (e.inputType === "deleteContentBackward") { e.preventDefault(); erase(); } });
  input.addEventListener("focus", () => gridEl.classList.add("focus"));
  input.addEventListener("blur", () => gridEl.classList.remove("focus"));

  G.shareBar($("#cwDone [data-share]"), () => (`Letterpile Daily Crossword #${puzzle.number}\nSolved in ${G.duration(st.t)}${st.rev.length ? ` (${st.rev.length} squares revealed)` : ""}\nletterpile.app/games/crossword`), "/games/crossword");

  G.open("crossword").then(res => {
    date = res.date;
    if (!res.puzzle) { G.comeBackSoon($(".cw-game")); return; }
    puzzle = res.puzzle;
    sol = G.decode(puzzle.s, `crossword:${date}`);
    st = G.state("crossword", date) || { l: Array(N * N).fill(""), bad: [], rev: [], t: 0, done: false };
    build();
    sel = entries[0].cells[0]; dir = "A";
    timer = G.timer($("#cwTimer"), st.t || 0, s => { if (s % 5 === 0 && !st.done) save(); });
    paint();
    if (st.done) win();
    else { timer.start(); msg.textContent = "Select a square and start typing."; }
    document.getElementById("game").dataset.ready = "1";
  });
})();
