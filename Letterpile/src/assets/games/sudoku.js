/* Daily Sudoku player: digits and pencil notes, rule-conflict highlighting, undo, a timer that
   pauses while the page is hidden, and saved progress per day. */
(function () {
  "use strict";
  const G = window.Games, $ = s => document.querySelector(s);
  const grid = $("#sdGrid");
  if (!G || !grid) return;
  const cells = [...grid.querySelectorAll(".sd-cell")];
  const msg = $("#sdMsg"), notesBtn = $("#sdNotes");
  const R = i => Math.floor(i / 9), C = i => i % 9, B = i => Math.floor(R(i) / 3) * 3 + Math.floor(C(i) / 3);
  const peer = (a, b) => a !== b && (R(a) === R(b) || C(a) === C(b) || B(a) === B(b));
  let date, puzzle, solution, givens, st, sel = 0, notes = false, undo = [], timer;

  const save = () => { st.t = timer ? timer.elapsed() : st.t; G.save(G.key("sudoku", date), st); };

  function render() {
    const v = st.v;
    const clash = new Set();
    for (let i = 0; i < 81; i++) if (v[i] !== "0") for (let j = i + 1; j < 81; j++) if (v[j] === v[i] && peer(i, j)) { clash.add(i); clash.add(j); }
    cells.forEach((el, i) => {
      const d = v[i], given = givens[i] !== "0";
      el.classList.toggle("given", given);
      el.classList.toggle("sel", i === sel);
      el.classList.toggle("peer", i !== sel && peer(i, sel));
      el.classList.toggle("same", d !== "0" && i !== sel && d === v[sel]);
      el.classList.toggle("clash", clash.has(i));
      if (d !== "0") el.textContent = d;
      else if (st.n[i]) el.innerHTML = `<span class="sd-notes">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<i>${st.n[i] & (1 << n) ? n : ""}</i>`).join("")}</span>`;
      else el.textContent = "";
      const ns = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => st.n[i] & (1 << n));
      el.setAttribute("aria-label", `Row ${R(i) + 1}, column ${C(i) + 1}, ${d !== "0" ? d + (given ? ", given" : "") + (clash.has(i) ? ", conflict" : "") : ns.length ? "notes " + ns.join(" ") : "empty"}`);
      el.tabIndex = i === sel ? 0 : -1;
    });
  }
  function select(i, focus = true) { sel = i; render(); if (focus) cells[i].focus(); }

  function snapshot() { undo.push({ v: st.v, n: st.n.slice() }); if (undo.length > 200) undo.shift(); }
  function setDigit(d) {
    if (st.done || givens[sel] !== "0") return;
    snapshot();
    const v = [...st.v];
    if (notes && d) {
      if (v[sel] !== "0") { undo.pop(); return; }
      st.n[sel] ^= 1 << d;
    } else {
      v[sel] = d && v[sel] !== String(d) ? String(d) : "0";
      if (v[sel] !== "0") for (let j = 0; j < 81; j++) if (peer(sel, j)) st.n[j] &= ~(1 << d);
      st.v = v.join("");
    }
    after();
  }
  function after() {
    render();
    if (st.v === solution) win();
    save();
  }
  function win() {
    st.done = true;
    timer.stop();
    st.t = timer.elapsed();
    msg.textContent = `Solved in ${G.duration(st.t)}.`;
    $("#sdDoneText").textContent = `You solved the ${puzzle.difficulty} puzzle for ${G.longDate(date)} in ${G.duration(st.t)}.`;
    $("#sdDone").hidden = false;
    grid.classList.add("solved");
  }

  grid.addEventListener("click", e => { const c = e.target.closest(".sd-cell"); if (c) select(+c.dataset.i); });
  $("#sdPad").addEventListener("click", e => { const b = e.target.closest("[data-digit]"); if (b) { setDigit(+b.dataset.digit); cells[sel].focus({ preventScroll: true }); } });
  $("#sdErase").addEventListener("click", () => {
    if (st.done || givens[sel] !== "0") return;
    snapshot();
    st.v = st.v.slice(0, sel) + "0" + st.v.slice(sel + 1); st.n[sel] = 0;
    after();
  });
  $("#sdUndo").addEventListener("click", () => { const u = undo.pop(); if (!u || st.done) return; st.v = u.v; st.n = u.n; after(); });
  const toggleNotes = () => { notes = !notes; notesBtn.setAttribute("aria-pressed", String(notes)); notesBtn.textContent = `Notes: ${notes ? "on" : "off"}`; };
  notesBtn.addEventListener("click", toggleNotes);
  $("#sdShare").addEventListener("click", () => G.share(`Letterpile Daily Sudoku #${puzzle.number} (${puzzle.difficulty})\nSolved in ${G.duration(st.t)}\nletterpile.app/games/sudoku`));

  grid.addEventListener("keydown", e => {
    const k = e.key;
    const move = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[k];
    if (move) {
      e.preventDefault();
      const r = R(sel), c = C(sel);
      const n = k === "ArrowLeft" ? r * 9 + (c + 8) % 9 : k === "ArrowRight" ? r * 9 + (c + 1) % 9 : (sel + move + 81) % 81;
      select(n);
    } else if (/^[1-9]$/.test(k)) { e.preventDefault(); setDigit(+k); }
    else if (k === "Backspace" || k === "Delete" || k === "0") { e.preventDefault(); $("#sdErase").click(); }
    else if (k === "n" || k === "N") { e.preventDefault(); toggleNotes(); }
    else if ((e.ctrlKey || e.metaKey) && (k === "z" || k === "Z")) { e.preventDefault(); $("#sdUndo").click(); }
  });

  G.open("sudoku").then(res => {
    date = res.date;
    if (!res.puzzle) { G.comeBackSoon($(".sudoku-game")); return; }
    puzzle = res.puzzle;
    givens = puzzle.givens;
    solution = G.decode(puzzle.s, `sudoku:${date}`);
    st = G.state("sudoku", date) || { v: givens, n: Array(81).fill(0), t: 0, done: false };
    $("#sdLevel").textContent = puzzle.difficulty;
    timer = G.timer($("#sdTimer"), st.t || 0, s => { if (s % 5 === 0 && !st.done) save(); });
    sel = givens.indexOf("0");
    render();
    if (st.done) { win(); } else { timer.start(); msg.textContent = "Fill every row, column and box with 1 to 9."; }
    document.getElementById("game").dataset.ready = "1";
  });
})();
