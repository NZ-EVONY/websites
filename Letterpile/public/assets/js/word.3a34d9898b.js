/* Word lookup (/word?w=): the same facts as the static word pages, computed in the browser. Goes
   to a word's static page when it has one. */
(function () {
  "use strict";
  const { $, esc, getParams, setParams, letterInput } = UI;
  const T = WordToolsClient;
  const out = $("#result");
  letterInput($("#w"), { blanks: false });
  const hasPage = w => !!document.querySelector(`a[href="/word/${w}"]`);
  const list = ws => `<p class="wordlist">${ws.map(w => (hasPage(w) ? `<a href="/word/${w}">${w}</a>` : `<button type="button" class="word plain" data-word="${esc(w)}">${esc(w)}</button>`)).join(" ")}</p>`;
  const n = (k, one, many = `${one}s`) => `${k.toLocaleString()} ${k === 1 ? one : many}`;
  function look(w) {
    if (!w) return;
    if (hasPage(w)) { location.replace(`/word/${w}`); return; }
    setParams({ w });
    if (!document.querySelector('meta[name="robots"]')) { const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex, follow"; document.head.append(m); }
    T.run(out, async current => {
      const r = await T.compute("wordInfo", w);
      if (!current() || !r) return;
      const W = esc(r.word.toUpperCase());
      if (!r.known) { out.innerHTML = `<p class="empty">${W} isn't in the ENABLE word list. Check the spelling, or try the <a href="/?letters=${esc(r.word)}">Word Unscrambler</a> to see what its letters make.</p>`; return; }
      const pts = Engine.score(r.word, "scrabble"), wwf = Engine.score(r.word, "wwf");
      out.innerHTML = `<h2>${W}</h2>
        <p>${W} is in the ENABLE word list${r.common ? " and is a common English word" : ""}: ${r.word.length} letters, ${pts} points with common tile values and ${wwf} with Words With Friends values.</p>
        <h3>Anagrams</h3>${r.anagrams.length ? list(r.anagrams) : "<p>None.</p>"}
        <h3>Words inside it <span class="count">${r.insideCount.toLocaleString()}</span></h3>${r.insideCount ? list(r.inside) + (r.insideCount > r.inside.length ? `<p class="hint">The ${r.inside.length} longest.</p>` : "") : "<p>None of three or more letters.</p>"}
        <h3>Longer words containing it <span class="count">${r.longerCount.toLocaleString()}</span></h3>${r.longerCount ? list(r.longer) + (r.longerCount > r.longer.length ? `<p class="hint">The ${r.longer.length} shortest.</p>` : "") : "<p>None.</p>"}
        <h3>Hooks</h3><p>${n(r.front.length, "front hook")}, ${n(r.back.length, "back hook")}.</p>${r.front.length + r.back.length ? list([...r.front, ...r.back]) : ""}
        <p><button type="button" class="word plain" data-word="${esc(r.word)}">Look up ${W}</button> <a href="/rhyming-words?w=${esc(r.word)}">Rhymes for ${W}</a></p>`;
    });
  }
  $("#form").addEventListener("submit", e => { e.preventDefault(); look($("#w").value.toLowerCase().replace(/[^a-z]/g, "")); });
  T.onFilter(() => { const w = getParams().w; if (w) look(w); });
  const q = getParams();
  if (q.w) { $("#w").value = q.w; look(q.w.toLowerCase().replace(/[^a-z]/g, "")); }
})();
