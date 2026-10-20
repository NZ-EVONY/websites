/* Hangman Solver: a pattern of known letters and blanks, plus the wrong guesses so far. */
(function () {
  "use strict";
  const { $, esc, getParams, setParams, letterInput } = UI;
  const T = WordToolsClient;
  const out = $("#results"), emptyHtml = out.innerHTML;
  letterInput($("#wrong"), { blanks: false });
  $("#pattern").addEventListener("input", () => { const el = $("#pattern"); const v = el.value.replace(/[^A-Za-z_?.\-\s]/g, ""); if (v !== el.value) el.value = v; });
  const chip = x => `<button type="button" class="word" data-word="${esc(x.word)}">${esc(x.word)}</button>`;
  function solve() {
    const pattern = $("#pattern").value.replace(/\s+/g, "").replace(/[?.\-]/g, "_");
    const wrong = $("#wrong").value.toLowerCase().replace(/[^a-z]/g, "");
    if (pattern.length < 2) { out.innerHTML = emptyHtml; return; }
    const clash = [...new Set(wrong)].filter(ch => pattern.toLowerCase().includes(ch));
    if (clash.length) { out.innerHTML = `<p class="empty">${clash.map(c => c.toUpperCase()).join(", ")} can't be both in the word and a wrong guess.</p>`; return; }
    setParams({ p: pattern, x: wrong });
    T.run(out, async current => {
      const r = await T.compute("hangman", pattern, wrong);
      if (!current()) return;
      if (!r.total) { out.innerHTML = `<p class="empty">No words in the list fit ${esc(pattern.toUpperCase())}${wrong ? " without those letters" : ""}. Check the pattern, or the word may be a name or not in the list.</p>`; return; }
      const top = r.next.slice(0, 8);
      out.innerHTML = `<p class="summary">${r.total.toLocaleString()} possible ${r.total === 1 ? "word" : "words"}</p>
        ${r.total > 1 && top.length ? `<section class="group" data-len="6"><h3>Best next guesses</h3><ol class="wt-bars">${top.map(x => `<li><b>${x.letter.toUpperCase()}</b><span class="bar" data-w="${Math.round(100 * x.n / r.total)}"></span><small>in ${x.n.toLocaleString()} of ${r.total.toLocaleString()} (${Math.round(100 * x.n / r.total)}%)</small></li>`).join("")}</ol></section>` : ""}
        <section class="group" data-len="4"><h3>Possible words <span class="count">${r.total.toLocaleString()}</span></h3><div class="words">${r.words.slice(0, 400).map(chip).join("")}</div>${r.total > 400 ? `<p class="hint more">Showing 400, everyday words first.</p>` : ""}</section>`;
      out.querySelectorAll(".bar[data-w]").forEach(b => b.style.setProperty("--w", `${Math.max(3, +b.dataset.w)}%`));
    });
  }
  $("#form").addEventListener("submit", e => { e.preventDefault(); solve(); });
  T.onFilter(() => { if (out.querySelector(".words")) solve(); });
  const q = getParams();
  if (q.p) { $("#pattern").value = q.p; $("#wrong").value = q.x || ""; solve(); }
})();
