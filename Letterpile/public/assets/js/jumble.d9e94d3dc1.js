/* Jumble Solver page. Extracted from the live jumble-solver.html inline script. */
(function () {
  "use strict";
  const { $, esc, chip, plainWord, withWords, getParams, setParams, letterInput, onWordsFilter } = UI;
  const inputs = () => [...document.querySelectorAll("#inputs input")];
  function addInput(v = "") {
    if (inputs().length >= 8) return;
    const n = inputs().length + 1;
    $("#inputs").insertAdjacentHTML("beforeend", `<label class="field jumble-field"><span>Word ${n}</span><input class="big-input" type="text" maxlength="12" value="${esc(v)}"></label>`);
    letterInput(inputs().at(-1), { blanks: false });
  }
  $("#add").addEventListener("click", () => { addInput(); inputs().at(-1).focus(); });
  $("#clear").addEventListener("click", () => {
    inputs().forEach(i => { i.value = ""; }); $("#final").value = "";
    $("#results").innerHTML = `<p class="empty">Cleared. Type the scrambled words again.</p>`; setParams({}); inputs()[0].focus();
  });
  letterInput($("#final"), { blanks: false });

  function run() {
    const words = inputs().map(i => i.value.toLowerCase().replace(/[^a-z]/g, ""));
    const fin = $("#final").value.toLowerCase().replace(/[^a-z]/g, "");
    setParams({ w: words.filter(Boolean).join(","), final: fin });
    const out = $("#results");
    if (!words.some(Boolean) && !fin) { out.innerHTML = `<p class="empty">Enter at least one scrambled word.</p>`; return; }
    withWords(out, () => {
      let html = words.map(w => {
        if (!w) return "";
        const ans = Engine.anagrams(w).exact;
        const all = Engine.isWord(w) && !Engine.isHidden(w) ? [w, ...ans] : ans;
        return `<section class="group"><h3>${esc(w.toUpperCase())} <span class="count">${all.length ? all.length + (all.length === 1 ? " answer" : " answers") : "no match"}</span></h3>
          <div class="words">${all.length ? all.map(a => chip(a)).join("") : `<span class="hint">No anagram found. Check the letters.</span>`}</div></section>`;
      }).join("");
      if (fin) {
        const r = Engine.anagrams(fin, { phrases: fin.length >= 6 });
        const single = Engine.isWord(fin) && !Engine.isHidden(fin) ? [fin, ...r.exact] : r.exact;
        html += `<section class="group"><h3>Final: ${esc(fin.toUpperCase())}</h3>
          ${single.length ? `<div class="words spaced">${single.map(a => chip(a)).join("")}</div>` : ""}
          ${r.phrases.length ? `<div class="words">${r.phrases.slice(0, 200).map(plainWord).join("")}</div>` : ""}
          ${!single.length && !r.phrases.length ? `<p class="hint">No one- or two-word answers. The punchline may be three or more words.</p>` : ""}</section>`;
      }
      out.innerHTML = html;
    });
  }
  $("#form").addEventListener("submit", e => { e.preventDefault(); run(); });
  onWordsFilter(() => { if (inputs().some(i => i.value.trim()) || $("#final").value.trim()) run(); });

  const p = getParams();
  const start = p.w ? p.w.split(",") : [];
  for (let i = 0; i < Math.max(4, Math.min(8, start.length)); i++) addInput(start[i] || "");
  if (p.final) $("#final").value = p.final;
  if (p.w || p.final) run(); else inputs()[0].focus();
})();
