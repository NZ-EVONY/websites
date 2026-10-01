/* Anagram Solver page. Extracted from the live anagram-solver.html inline script. */
(function () {
  "use strict";
  const { $, esc, chip, plainWord, withWords, compute, getParams, setParams, letterInput, onWordsFilter } = UI;
  const MAX = Engine.LIMITS.letters;
  letterInput($("#q"), { blanks: false });
  function run() {
    const q = $("#q").value.trim(), phrases = $("#phrases").checked;
    setParams({ q, two: phrases ? "" : "0" });
    const out = $("#results");
    const letters = q.toLowerCase().replace(/[^a-z]/g, "");
    if (letters.length < 2) { out.innerHTML = `<p class="empty">Enter at least two letters.</p>`; return; }
    if (letters.length > MAX) { out.innerHTML = `<p class="empty">Use up to ${MAX} letters.</p>`; return; }
    withWords(out, async current => {
      const r = await compute("anagrams", letters, { phrases });
      if (!current()) return;
      const single = r.exact.length
        ? `<section class="group"><h3>Single-word anagrams <span class="count">${r.exact.length}</span></h3><div class="words">${r.exact.map(w => chip(w)).join("")}</div></section>`
        : `<p class="empty spaced">No single-word anagrams of <b>${esc(letters.toUpperCase())}</b> in the word list. Check the spelling, or try the two-word option.</p>`;
      const two = phrases ? (r.phrases.length
        ? `<section class="group"><h3>Two-word anagrams <span class="count">${r.phrases.length}${r.phrases.length >= 400 ? "+" : ""}</span></h3><div class="words">${r.phrases.map(plainWord).join("")}</div></section>`
        : `<p class="hint">No two-word anagrams found.</p>`) : "";
      out.innerHTML = single + two;
    });
  }
  $("#form").addEventListener("submit", e => { e.preventDefault(); run(); });
  onWordsFilter(() => { if ($("#q").value.trim()) run(); });
  const p = getParams();
  if (p.q) { $("#q").value = p.q; $("#phrases").checked = p.two !== "0"; run(); } else $("#q").focus();
})();
