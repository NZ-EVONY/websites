/* Rack word finder: /scrabble-word-finder (data-scheme="scrabble") and /words-with-friends
   (data-scheme="wwf"). Extracted from the two live pages' identical inline scripts. */
(function () {
  "use strict";
  const { $, chip, renderGroups, withWords, getParams, setParams, letterInput, onWordsFilter } = UI;
  const SCHEME = document.body.dataset.scheme;
  const BONUS = Engine.SCHEMES[SCHEME].bingo;
  for (let n = 2; n <= 15; n++) $("#len").insertAdjacentHTML("beforeend", `<option>${n}</option>`);
  const clean = s => s.toLowerCase().replace(/[^a-z]/g, "");
  letterInput($("#rack"));
  letterInput($("#board"), { blanks: false });
  let last = [];
  let view = "best";

  function render() {
    const out = $("#results");
    const bar = `<div class="toolbar"><strong>${last.length.toLocaleString()} words</strong>
      <label class="push">Show <select id="view">
        <option value="best"${view === "best" ? " selected" : ""}>Highest score first</option>
        <option value="length"${view === "length" ? " selected" : ""}>Grouped by length</option></select></label></div>
      <p class="hint under-toolbar">Points use commonly used letter values and exclude board bonus squares. Outlined tiles use all 7 of your tiles (+${BONUS}, a commonly reported bonus; check your game's rules). Dotted letters come from blanks.</p>`;
    if (!last.length) { out.innerHTML = `<p class="empty">No playable words. Try adding board letters or a blank (<kbd>?</kbd>), or check the spelling of your tiles.</p>`; return; }
    if (view === "best") {
      const top = last.slice(0, 300);
      out.innerHTML = bar + `<div class="words">${top.map(w => chip(w, { scheme: SCHEME })).join("")}</div>` +
        (last.length > top.length ? `<p class="hint more">Showing the top ${top.length}.</p>` : "");
    } else {
      out.innerHTML = bar + renderGroups(last, { scheme: SCHEME, sort: "score", label: n => `${n}-letter words` });
    }
    $("#view").addEventListener("change", e => { view = e.target.value; render(); });
  }

  function run() {
    const rack = $("#rack").value.trim();
    const opts = {
      scheme: SCHEME, board: clean($("#board").value),
      startsWith: clean($("#starts").value), endsWith: clean($("#ends").value),
      contains: clean($("#contains").value), length: +$("#len").value || 0,
    };
    setParams({ rack, board: opts.board, starts: opts.startsWith, ends: opts.endsWith, contains: opts.contains, len: opts.length || "" });
    const out = $("#results");
    const { letters, blanks } = Engine.parseLetters(rack, 2);
    if (!letters.length && !blanks) { out.innerHTML = `<p class="empty">Enter the letters on your rack.</p>`; return; }
    if (letters.length + blanks > 9) { out.innerHTML = `<p class="empty">That's more tiles than a rack holds.</p>`; return; }
    withWords(out, () => { last = Engine.findPlays(rack, opts); render(); });
  }

  $("#form").addEventListener("submit", e => { e.preventDefault(); run(); });
  onWordsFilter(() => { if ($("#rack").value.trim()) run(); });
  const p = getParams();
  if (p.rack) {
    $("#rack").value = p.rack; $("#board").value = p.board || ""; $("#starts").value = p.starts || "";
    $("#ends").value = p.ends || ""; $("#contains").value = p.contains || ""; $("#len").value = p.len || "";
    if (p.starts || p.ends || p.contains || p.len) $("#adv").open = true;
    run();
  } else $("#rack").focus();
})();
