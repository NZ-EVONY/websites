(function () {
  "use strict";
  const { $, esc, getParams, setParams, letterInput } = UI;
  const T = WordToolsClient;
  const out = $("#results"), emptyHtml = out.innerHTML;
  letterInput($("#from"), { blanks: false });
  letterInput($("#to"), { blanks: false });
  const clean = s => s.toLowerCase().replace(/[^a-z]/g, "");
  function step(w, prev) {
    return [...w].map((ch, i) => (prev && prev[i] !== ch ? `<b>${esc(ch)}</b>` : esc(ch))).join("");
  }
  function solve() {
    const a = clean($("#from").value), b = clean($("#to").value);
    const avoid = $("#avoid").value.toLowerCase().split(/[^a-z]+/).filter(Boolean);
    const common = $("#common").checked;
    if (!a || !b) { out.innerHTML = emptyHtml; return; }
    if (a.length !== b.length) { out.innerHTML = `<p class="empty">Both words need the same number of letters (${a.toUpperCase()} has ${a.length}, ${b.toUpperCase()} has ${b.length}).</p>`; return; }
    setParams({ from: a, to: b, avoid: avoid.join(","), all: common ? "" : "1" });
    T.run(out, async current => {
      const [okA, okB] = await Promise.all([T.compute("isWord", a), T.compute("isWord", b)]);
      if (!current()) return;
      if (!okA || !okB) { out.innerHTML = `<p class="empty">${[!okA && a, !okB && b].filter(Boolean).map(w => w.toUpperCase()).join(" and ")} ${!okA && !okB ? "aren't" : "isn't"} in the word list.</p>`; return; }
      let path = await T.compute("ladder", a, b, { avoid, common }), widened = false;
      if (!path && common) { path = await T.compute("ladder", a, b, { avoid }); widened = !!path; }
      if (!current()) return;
      if (!path) { out.innerHTML = `<p class="empty">No ladder joins ${a.toUpperCase()} and ${b.toUpperCase()} through the word list${avoid.length ? " without the words you're avoiding" : ""}.</p>`; return; }
      out.innerHTML = `<p class="summary">${path.length - 1} step${path.length === 2 ? "" : "s"} from ${esc(a.toUpperCase())} to ${esc(b.toUpperCase())}${widened ? ` <small>(no ladder uses only everyday words, so this one includes less common words)</small>` : ""}</p>
        <ol class="wt-ladder">${path.map((w, i) => `<li><button type="button" class="word" data-word="${esc(w)}">${step(w, path[i - 1])}</button></li>`).join("")}</ol>
        <p class="hint">Don't like a step? Add it to “Avoid these words” and solve again.</p>`;
    });
  }
  $("#form").addEventListener("submit", e => { e.preventDefault(); solve(); });
  $("#swap").addEventListener("click", () => { const t = $("#from").value; $("#from").value = $("#to").value; $("#to").value = t; solve(); });
  T.onFilter(() => { if (out.querySelector(".wt-ladder")) solve(); });
  const q = getParams();
  if (q.from && q.to) { $("#from").value = q.from; $("#to").value = q.to; $("#avoid").value = (q.avoid || "").replace(/,/g, " "); $("#common").checked = !q.all; solve(); }
})();
