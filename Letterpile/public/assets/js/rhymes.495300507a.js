(function () {
  "use strict";
  const { $, esc, getParams, setParams, letterInput } = UI;
  const root = $("[data-rhymes]"), out = $("#results"), emptyHtml = out.innerHTML;
  let data = null;
  letterInput($("#word"), { blanks: false });
  function load() {
    if (data) return Promise.resolve(data);
    return fetch(root.dataset.rhymes).then(r => { if (!r.ok) throw new Error("Couldn't load the rhyme list."); return r.json(); }).then(groups => {
      const words = new Map(), byTail = new Map(), byLast = new Map();
      for (const [tail, list] of groups) {
        const ws = list.split(" ").map(s => [s.slice(1), +s[0]]);
        byTail.set(tail, ws);
        const last = lastSyllable(tail);
        if (!byLast.has(last)) byLast.set(last, []);
        byLast.get(last).push(tail);
        for (const [w, n] of ws) words.set(w, [tail, n]);
      }
      return (data = { words, byTail, byLast });
    });
  }
  function lastSyllable(tail) {
    const ph = tail.split(" ");
    let i = ph.length - 1;
    while (i > 0 && !/^[AEIOU]/.test(ph[i])) i--;
    return ph.slice(i).join(" ");
  }
  const chip = w => `<button type="button" class="word" data-word="${esc(w)}">${esc(w)}</button>`;
  const groups = (list, label) => {
    const by = new Map();
    for (const [w, n] of list) { const k = Math.min(n, 5); if (!by.has(k)) by.set(k, []); by.get(k).push(w); }
    return [...by].sort((a, b) => a[0] - b[0]).map(([n, ws]) => `<section class="group" data-len="${n + 2}"><h3>${label} · ${n === 5 ? "5 or more syllables" : `${n} syllable${n === 1 ? "" : "s"}`} <span class="count">${ws.length}</span></h3><div class="words">${ws.slice(0, 300).map(chip).join("")}</div>${ws.length > 300 ? `<p class="hint more">Showing 300 of ${ws.length}.</p>` : ""}</section>`).join("");
  };
  function solve() {
    const w = $("#word").value.toLowerCase().replace(/[^a-z]/g, "");
    if (!w) { out.innerHTML = emptyHtml; return; }
    setParams({ w });
    if (!data) out.innerHTML = `<p class="loading">Loading the rhyme list…</p>`;
    load().then(d => {
      const hit = d.words.get(w);
      if (!hit) { out.innerHTML = `<p class="empty">${esc(w.toUpperCase())} isn't in the pronunciation list, so its rhymes can't be looked up. Try a related form (singular, or without -ing).</p>`; return; }
      const [tail, n] = hit;
      const perfect = d.byTail.get(tail).filter(x => x[0] !== w);
      const near = (d.byLast.get(lastSyllable(tail)) || []).filter(t => t !== tail).flatMap(t => d.byTail.get(t));
      const sort = a => a.sort((x, y) => x[1] - y[1] || (x[0] < y[0] ? -1 : 1));
      out.innerHTML = `<p class="summary">${esc(w.toUpperCase())}: ${n} syllable${n === 1 ? "" : "s"}. ${perfect.length.toLocaleString()} perfect rhyme${perfect.length === 1 ? "" : "s"}, ${near.length.toLocaleString()} near rhyme${near.length === 1 ? "" : "s"}.</p>
        ${perfect.length ? groups(sort(perfect), "Perfect rhymes") : `<p class="empty">No perfect rhymes in the list.</p>`}
        ${near.length ? `<h3 class="wt-sub">Near rhymes (same last syllable)</h3>${groups(sort(near), "Near rhymes")}` : ""}`;
    }).catch(e => { out.innerHTML = `<p class="error">${esc(e.message)} Check your connection and try again.</p>`; });
  }
  $("#form").addEventListener("submit", e => { e.preventDefault(); solve(); });
  const q = getParams();
  if (q.w) { $("#word").value = q.w; solve(); }
})();
