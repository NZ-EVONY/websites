/* Wordle Solver page. Extracted from the live wordle-solver.html inline script.
   Changes: tiles have full accessible names, and the word list loads only once a
   guess has been added (it used to load on page open). */
(function () {
  "use strict";
  const { $, esc, chip, withWords, letterInput, onWordsFilter } = UI;
  const CYCLE = { b: "y", y: "g", g: "b" };
  const NAMES = { b: "gray", y: "yellow", g: "green" };
  let rows = [];
  const emptyHtml = $("#results").innerHTML;

  function save() { try { sessionStorage.setItem("wordle", JSON.stringify({ rows, size: $("#size").value })); } catch {} }

  function drawGrid(focus) {
    $("#grid").innerHTML = rows.map((r, ri) => `<div class="wrow" role="group" aria-label="Guess ${ri + 1}: ${esc(r.word.toUpperCase())}">${[...r.word].map((ch, i) =>
      `<button type="button" class="wtile" data-r="${ri}" data-i="${i}" data-m="${r.marks[i]}" aria-label="Letter ${esc(ch.toUpperCase())}, position ${i + 1}, ${NAMES[r.marks[i]]}. Press to change.">${esc(ch)}<span class="wmark" aria-hidden="true"></span></button>`).join("")}
      <button type="button" class="del" data-del="${ri}" aria-label="Remove guess ${ri + 1}">×</button></div>`).join("");
    if (focus) $(`.wtile[data-r="${focus[0]}"][data-i="${focus[1]}"]`)?.focus();
    save();
    solve();
  }

  function solve() {
    const out = $("#results");
    const size = +$("#size").value;
    if (!rows.length) { out.innerHTML = emptyHtml; return; }
    withWords(out, () => {
      const list = Engine.wordleCandidates(rows, size);
      if (!list.length) { out.innerHTML = `<p class="empty">No words fit these colors. Check each tile: a letter that is gray in one spot and green or yellow in another usually means a repeated letter.</p>`; return; }
      const top = list.slice(0, 12);
      const rest = list.slice(0, 600).map(x => x.word).sort();
      out.innerHTML = `<p class="summary">${list.length.toLocaleString()} possible ${list.length === 1 ? "word" : "words"}</p>
        <section class="group"><h3>Suggested next guesses</h3><div class="words">${top.map(x => chip(x.word)).join("")}</div></section>
        ${list.length > top.length ? `<section class="group"><h3>All possibilities <span class="count">${list.length}</span></h3><div class="words">${rest.map(w => chip(w)).join("")}</div>
          ${list.length > 600 ? `<p class="hint more">Showing 600 alphabetically.</p>` : ""}</section>` : ""}`;
    });
  }

  $("#grid").addEventListener("click", e => {
    const t = e.target.closest(".wtile");
    if (t) {
      const r = rows[t.dataset.r];
      const m = [...r.marks]; m[t.dataset.i] = CYCLE[m[t.dataset.i]]; r.marks = m.join("");
      return drawGrid([t.dataset.r, t.dataset.i]);
    }
    const d = e.target.closest("[data-del]");
    if (d) { rows.splice(+d.dataset.del, 1); drawGrid(); }
  });
  letterInput($("#guess"), { blanks: false });
  $("#addForm").addEventListener("submit", e => {
    e.preventDefault();
    const size = +$("#size").value;
    const w = $("#guess").value.toLowerCase().replace(/[^a-z]/g, "");
    if (w.length !== size) { $("#guess").setCustomValidity(`Enter a ${size}-letter word`); $("#guess").reportValidity(); return; }
    if (rows.length >= 10) return;
    rows.push({ word: w, marks: "b".repeat(size) });
    $("#guess").value = "";
    drawGrid();
  });
  $("#guess").addEventListener("input", () => $("#guess").setCustomValidity(""));
  $("#size").addEventListener("change", () => { rows = []; $("#guess").maxLength = +$("#size").value; drawGrid(); });
  $("#reset").addEventListener("click", () => { rows = []; drawGrid(); });
  onWordsFilter(() => { if (rows.length) solve(); });

  try {
    const s = JSON.parse(sessionStorage.getItem("wordle") || "null");
    if (s) { $("#size").value = s.size; rows = s.rows || []; }
  } catch {}
  drawGrid();
})();
