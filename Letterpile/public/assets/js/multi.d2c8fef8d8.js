/* Multi-Board Word Solver: one set of guesses played on 4 or 8 five-letter boards at once. Each
   board has its own colors and its own list of words that still fit. */
(function () {
  "use strict";
  const { $, esc, compute, withWords, letterInput, onWordsFilter } = UI;
  const CYCLE = { b: "y", y: "g", g: "b" }, NAMES = { b: "gray", y: "yellow", g: "green" };
  const boardsEl = $("#boards"), sumEl = $("#summary");
  let guesses = [], marks = [], count = 4;
  function save() { try { sessionStorage.setItem("multi", JSON.stringify({ guesses, marks, count })); } catch {} }

  function draw(focus) {
    boardsEl.innerHTML = Array.from({ length: count }, (_, b) => `<section class="wt-board" aria-labelledby="bh${b}"><h3 id="bh${b}">Board ${b + 1} <span class="count" data-count="${b}"></span></h3>
      <div class="wgrid">${guesses.map((g, gi) => `<div class="wrow" role="group" aria-label="Board ${b + 1}, guess ${gi + 1}: ${esc(g.toUpperCase())}">${[...g].map((ch, i) => `<button type="button" class="wtile" data-b="${b}" data-g="${gi}" data-i="${i}" data-m="${marks[b][gi][i]}" aria-label="${esc(ch.toUpperCase())}, position ${i + 1}, ${NAMES[marks[b][gi][i]]}. Press to change.">${esc(ch)}<span class="wmark" aria-hidden="true"></span></button>`).join("")}</div>`).join("")}</div>
      <div class="words" data-list="${b}"></div></section>`).join("");
    if (focus) boardsEl.querySelector(`.wtile[data-b="${focus[0]}"][data-g="${focus[1]}"][data-i="${focus[2]}"]`)?.focus();
    save();
    solve();
  }
  function solve() {
    if (!guesses.length) { sumEl.innerHTML = `<p class="empty">Add the first guess you played. It appears on every board; then set each board's colors.</p>`; boardsEl.querySelectorAll("[data-list]").forEach(el => { el.innerHTML = ""; }); return; }
    withWords(sumEl, async current => {
      const lists = [];
      for (let b = 0; b < count; b++) lists.push(await compute("wordleCandidates", guesses.map((w, gi) => ({ word: w, marks: marks[b][gi] })), 5));
      if (!current()) return;
      const solved = b => marks[b].some(m => m === "ggggg");
      let pick = null, open = 0;
      lists.forEach((list, b) => {
        const el = boardsEl.querySelector(`[data-list="${b}"]`), c = boardsEl.querySelector(`[data-count="${b}"]`);
        if (solved(b)) { c.textContent = "solved"; el.innerHTML = ""; return; }
        open++;
        c.textContent = `${list.length.toLocaleString()} left`;
        el.innerHTML = list.length ? list.slice(0, 12).map(x => `<button type="button" class="word" data-word="${esc(x.word)}">${esc(x.word)}</button>`).join("") + (list.length > 12 ? `<span class="hint">+${(list.length - 12).toLocaleString()} more</span>` : "") : `<span class="empty">No words fit: check this board's colors.</span>`;
        if (list.length && (!pick || list.length < pick.n)) pick = { n: list.length, b, word: list[0].word };
      });
      sumEl.innerHTML = !open ? `<p class="summary">All ${count} boards solved.</p>`
        : pick ? `<p class="summary">Suggested next guess: <button type="button" class="word bingo" data-word="${esc(pick.word)}">${esc(pick.word)}</button> <small>${pick.n === 1 ? `the only word left on board ${pick.b + 1}` : `the top pick for board ${pick.b + 1}, which has the fewest words left (${pick.n.toLocaleString()})`}</small></p>`
        : `<p class="summary">No words fit one or more boards. Check the colors.</p>`;
    });
  }
  boardsEl.addEventListener("click", e => {
    const t = e.target.closest(".wtile");
    if (!t) return;
    const [b, g, i] = [+t.dataset.b, +t.dataset.g, +t.dataset.i];
    const m = [...marks[b][g]]; m[i] = CYCLE[m[i]]; marks[b][g] = m.join("");
    draw([b, g, i]);
  });
  letterInput($("#guess"), { blanks: false });
  $("#addForm").addEventListener("submit", e => {
    e.preventDefault();
    const w = $("#guess").value.toLowerCase().replace(/[^a-z]/g, "");
    if (w.length !== 5) { $("#guess").setCustomValidity("Enter a 5-letter word"); $("#guess").reportValidity(); return; }
    if (guesses.length >= 13) return;
    guesses.push(w);
    marks.forEach(bm => bm.push("bbbbb"));
    $("#guess").value = "";
    draw();
  });
  $("#guess").addEventListener("input", () => $("#guess").setCustomValidity(""));
  const reset = () => { guesses = []; marks = Array.from({ length: count }, () => []); draw(); };
  $("#count").addEventListener("change", () => { count = +$("#count").value; reset(); });
  $("#reset").addEventListener("click", reset);
  $("#undoGuess").addEventListener("click", () => { if (!guesses.length) return; guesses.pop(); marks.forEach(bm => bm.pop()); draw(); });
  onWordsFilter(() => { if (guesses.length) solve(); });
  try {
    const s = JSON.parse(sessionStorage.getItem("multi") || "null");
    if (s && [4, 8].includes(s.count) && s.marks?.length === s.count) { ({ guesses, marks, count } = s); $("#count").value = String(count); }
  } catch {}
  if (marks.length !== count) marks = Array.from({ length: count }, () => guesses.map(() => "bbbbb"));
  draw();
})();
