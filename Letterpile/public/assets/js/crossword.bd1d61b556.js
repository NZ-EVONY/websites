/* Crossword Solver page. Extracted from the live crossword-solver.html inline script. */
(function () {
  "use strict";
  const { $, esc, chip, withWords, getParams, setParams, letterInput, onWordsFilter } = UI;
  const norm = s => s.toLowerCase().replace(/[^a-z?_.*]/g, "");
  letterInput($("#include"), { blanks: false });
  letterInput($("#exclude"), { blanks: false });
  $("#pattern").addEventListener("input", () => {
    const n = norm($("#pattern").value).length;
    $("#len").textContent = n ? `${n} squares` : "";
  });
  function run() {
    const pattern = norm($("#pattern").value);
    const include = $("#include").value, exclude = $("#exclude").value;
    setParams({ p: pattern, inc: include, exc: exclude });
    const out = $("#results");
    if (pattern.length < 2) { out.innerHTML = `<p class="empty">Enter a pattern of at least two squares.</p>`; return; }
    $("#len").textContent = `${pattern.length} squares`;
    withWords(out, () => {
      const found = Engine.patternSearch(pattern, { include, exclude });
      const shown = found.slice(0, 800);
      out.innerHTML = found.length
        ? `<p class="summary">${found.length.toLocaleString()} ${found.length === 1 ? "word fits" : "words fit"} <code>${esc(pattern.toUpperCase())}</code></p>
           <div class="words">${shown.map(w => chip(w)).join("")}</div>${found.length > shown.length ? `<p class="hint more">Showing the first ${shown.length}. Add a known letter to narrow it.</p>` : ""}`
        : `<p class="empty">Nothing fits that pattern. Check the length, the known letters and any excluded letters.</p>`;
    });
  }
  $("#form").addEventListener("submit", e => { e.preventDefault(); run(); });
  onWordsFilter(() => { if ($("#pattern").value.trim()) run(); });
  const p = getParams();
  if (p.p) { $("#pattern").value = p.p; $("#include").value = p.inc || ""; $("#exclude").value = p.exc || ""; run(); } else $("#pattern").focus();
})();
