/* Word Combiner page. Extracted from the live word-combiner.html inline script.
   Change: without a shared link the page no longer combines the example words on
   load (that downloaded the whole word list before anyone used the tool). */
(function () {
  "use strict";
  const { $, esc, chip, plainWord, withWords, getParams, setParams, letterInput, onWordsFilter } = UI;
  const inputs = () => [...document.querySelectorAll("#inputs .w")];
  inputs().forEach(i => letterInput(i, { blanks: false, max: 40 }));
  function addInput(value = "") {
    const n = inputs().length + 1;
    if (n > 4) return;
    $("#inputs").insertAdjacentHTML("beforeend", `<label class="field"><span>Word ${n}</span><input type="text" class="w" maxlength="40" value="${esc(value)}"></label>`);
    letterInput(inputs().at(-1), { blanks: false, max: 40 });
    if (n === 4) $("#add").disabled = true;
  }
  $("#add").addEventListener("click", () => { addInput(); inputs().at(-1).focus(); });

  function run() {
    const words = inputs().map(i => i.value.trim()).filter(Boolean);
    setParams({ w: words.join(",") });
    const out = $("#results");
    if (words.length < 2) { out.innerHTML = `<p class="empty">Enter at least two words.</p>`; return; }
    withWords(out, () => {
      const { joined, blends } = Engine.combine(words);
      const real = blends.filter(b => b.real), fresh = blends.filter(b => !b.real);
      const block = (title, list, plain) => list.length ? `<section class="group"><h3>${title} <span class="count">${list.length}</span></h3>
        <div class="words">${list.map(w => plain ? plainWord(w.word || w) : chip(w)).join("")}</div></section>` : "";
      out.innerHTML = block("Blends that are already words", real) + block("New blends", fresh.slice(0, 150), true) + block("Joined", joined, true)
        || `<p class="empty">No blends found. Try longer words.</p>`;
    });
  }
  $("#form").addEventListener("submit", e => { e.preventDefault(); run(); });
  onWordsFilter(() => { if (getParams().w) run(); });
  const p = getParams();
  if (p.w) {
    const ws = p.w.split(",").slice(0, 4);
    inputs().forEach((inp, i) => { inp.value = ws[i] || ""; });
    ws.slice(2).forEach(addInput);
    run();
  }
})();
