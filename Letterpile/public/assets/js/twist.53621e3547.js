/* Text Twist and Wordscapes Solver page. Extracted from the live text-twist-solver.html inline script. */
(function () {
  "use strict";
  const { $, renderGroups, withWords, getParams, setParams, letterInput, onWordsFilter } = UI;
  const V = Engine.SCHEMES.scrabble.values;
  const drawWheel = s => { $("#wheel").innerHTML = [...s].map(ch => `<span>${ch}<sub>${V[ch]}</sub></span>`).join(""); };
  letterInput($("#letters"), { blanks: false });
  function run() {
    const letters = $("#letters").value.toLowerCase().replace(/[^a-z]/g, "");
    const slots = $("#slots").value.toLowerCase().replace(/[^a-z?_.*]/g, "");
    const min = +$("#min").value;
    setParams({ letters, slots, min: min === 3 ? "" : min });
    drawWheel(letters);
    const out = $("#results");
    if (letters.length < 3) { out.innerHTML = `<p class="empty">Enter at least three letters.</p>`; return; }
    const pattern = slots ? new RegExp("^" + [...slots].map(c => /[a-z]/.test(c) ? c : "[a-z]").join("") + "$") : null;
    withWords(out, () => {
      const found = Engine.unscramble(letters, { min, pattern });
      out.innerHTML = found.length
        ? `<p class="summary">${found.length} words</p>` + renderGroups(found)
        : `<p class="empty">No words${slots ? " fit that slot pattern" : ""}. Check the letters${slots ? " and the pattern length" : ""}, or lower the minimum length.</p>`;
    });
  }
  $("#twist").addEventListener("click", () => {
    const l = $("#letters").value.replace(/[^A-Za-z]/g, "");
    if (l.length > 1) { const s = Engine.scrambleWord(l.toLowerCase()); $("#letters").value = s.toUpperCase(); drawWheel(s); }
  });
  $("#form").addEventListener("submit", e => { e.preventDefault(); run(); });
  onWordsFilter(() => { if ($("#letters").value.trim()) run(); });
  const p = getParams();
  if (p.letters) { $("#letters").value = p.letters; $("#slots").value = p.slots || ""; $("#min").value = p.min || 3; run(); } else $("#letters").focus();
})();
