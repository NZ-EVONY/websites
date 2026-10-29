(function () {
  "use strict";
  const { $, esc, getParams, setParams, letterInput } = UI;
  const T = WordToolsClient;
  const out = $("#results"), emptyHtml = out.innerHTML;
  const SIDES = ["#top", "#right", "#bottom", "#left"];
  let res = null;
  SIDES.forEach(s => letterInput($(s), { blanks: false }));
  const chip = w => `<button type="button" class="word" data-word="${esc(w)}">${esc(w)}</button>`;
  const pair = p => `<li><span class="wt-pair">${chip(p[0])}<span aria-hidden="true">→</span>${chip(p[1])}</span> <small>${p[0].length + p[1].length} letters</small></li>`;

  function draw() {
    const common = $("#common").checked;
    const tier = w => res.common.has(w);
    const pairs = res.pairs.filter(p => !common || (tier(p[0]) && tier(p[1])));
    const words = res.words.filter(w => !common || tier(w));
    const byLen = new Map();
    for (const w of words) { const n = Math.min(w.length, 9); if (!byLen.has(n)) byLen.set(n, []); byLen.get(n).push(w); }
    out.innerHTML = `<p class="summary">${res.words.length.toLocaleString()} words fit the box; ${res.pairCount.toLocaleString()} two-word solutions.</p>
      ${res.singles.length ? `<section class="group" data-len="9"><h3>One-word solutions <span class="count">${res.singles.length}</span></h3><div class="words">${res.singles.map(chip).join("")}</div></section>` : ""}
      <section class="group" data-len="7"><h3>Shortest two-word solutions <span class="count">${pairs.length}</span></h3>${pairs.length ? `<ol class="wt-pairs">${pairs.slice(0, 40).map(pair).join("")}</ol>` : `<p class="empty">No two-word solution${common ? " made of everyday words. Untick “Everyday words only” to see the rest." : "."}</p>`}</section>
      ${[...byLen].sort((a, b) => b[0] - a[0]).map(([n, ws]) => `<section class="group" data-len="${n}"><h3>${n === 9 ? "9 or more letters" : `${n}-letter words`} <span class="count">${ws.length}</span></h3><div class="words">${ws.slice(0, 300).map(chip).join("")}</div>${ws.length > 300 ? `<p class="hint more">Showing 300 of ${ws.length}.</p>` : ""}</section>`).join("")}`;
  }
  function solve() {
    const sides = SIDES.map(s => $(s).value.toLowerCase().replace(/[^a-z]/g, ""));
    if (sides.some(s => !s)) { out.innerHTML = emptyHtml; return; }
    const all = sides.join("");
    if (new Set(all).size !== all.length) { out.innerHTML = `<p class="empty">Each letter can appear only once in the box.</p>`; return; }
    setParams({ s: sides.join("-") });
    T.run(out, async current => {
      const r = await T.compute("box", sides, { maxPairs: 2000 });
      if (!current()) return;
      const tiers = await T.compute("tiers", [...new Set([...r.words])]);
      if (!current()) return;
      res = { ...r, common: new Set(tiers) };
      draw();
    });
  }
  $("#form").addEventListener("submit", e => { e.preventDefault(); solve(); });
  $("#common").addEventListener("change", () => res && draw());
  T.onFilter(() => { if (res) solve(); });
  const q = getParams();
  const s = (q.s || "").split("-");
  if (s.length === 4) { SIDES.forEach((id, i) => { $(id).value = s[i]; }); solve(); }
})();
