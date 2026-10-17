(function () {
  "use strict";
  const { $, esc, getParams, setParams, letterInput } = UI;
  const T = WordToolsClient;
  const out = $("#results"), emptyHtml = out.innerHTML;
  let found = [];
  letterInput($("#outer"), { blanks: false });
  letterInput($("#center"), { blanks: false });

  const chip = x => `<button type="button" class="word${x.pangram ? " bingo" : ""}" data-word="${esc(x.word)}"${x.pangram ? ' title="Pangram: uses every letter"' : ""}>${esc(x.word)}</button>`;
  function draw() {
    if (!found.length) { out.innerHTML = `<p class="empty">No words use these letters with the center letter. Check the letters, or lower the minimum length.</p>`; return; }
    const start = $("#start").value, len = +$("#len").value, common = $("#common").checked;
    const shown = found.filter(x => (!start || x.word[0] === start) && (!len || (len === 9 ? x.word.length >= 9 : x.word.length === len)) && (!common || x.common));
    const pangrams = shown.filter(x => x.pangram);
    const byLen = new Map();
    for (const x of shown) { const n = Math.min(x.word.length, 9); if (!byLen.has(n)) byLen.set(n, []); byLen.get(n).push(x); }
    out.innerHTML = `<p class="summary">${found.length.toLocaleString()} ${found.length === 1 ? "word" : "words"}, ${found.filter(x => x.pangram).length} pangram${found.filter(x => x.pangram).length === 1 ? "" : "s"}${shown.length !== found.length ? ` <small>(${shown.length.toLocaleString()} shown with your filters)</small>` : ""}</p>
      ${pangrams.length ? `<section class="group" data-len="7"><h3>Pangrams <span class="count">${pangrams.length}</span></h3><div class="words">${pangrams.map(chip).join("")}</div></section>` : ""}
      ${[...byLen].sort((a, b) => b[0] - a[0]).map(([n, xs]) => `<section class="group" data-len="${n}"><h3>${n === 9 ? "9 or more letters" : `${n}-letter words`} <span class="count">${xs.length}</span></h3><div class="words">${xs.map(chip).join("")}</div></section>`).join("") || `<p class="empty">No words match these filters.</p>`}`;
  }
  function solve() {
    const outer = $("#outer").value.toLowerCase().replace(/[^a-z]/g, ""), center = $("#center").value.toLowerCase().replace(/[^a-z]/g, "");
    if (!center || !outer) { out.innerHTML = emptyHtml; return; }
    setParams({ l: outer, c: center, min: $("#min").value === "4" ? "" : $("#min").value });
    T.run(out, async current => {
      const res = await T.compute("hive", outer, center, { min: +$("#min").value });
      if (!current()) return;
      found = res;
      const starts = [...new Set(res.map(x => x.word[0]))].sort();
      $("#start").innerHTML = `<option value="">Any letter</option>${starts.map(l => `<option value="${l}">${l.toUpperCase()}</option>`).join("")}`;
      draw();
    });
  }
  $("#form").addEventListener("submit", e => { e.preventDefault(); solve(); });
  ["#start", "#len", "#common"].forEach(s => $(s).addEventListener("change", () => found.length && draw()));
  $("#min").addEventListener("change", () => { if (found.length) solve(); });
  T.onFilter(() => { if (found.length) solve(); });
  const q = getParams();
  if (q.l && q.c) { $("#outer").value = q.l; $("#center").value = q.c; if (q.min) $("#min").value = q.min; solve(); }
})();
