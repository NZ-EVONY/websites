(function () {
  "use strict";
  const { $, esc, getParams, setParams } = UI;
  const T = WordToolsClient;
  const out = $("#results"), keyEl = $("#key"), emptyHtml = out.innerHTML;
  const AZ = [..."abcdefghijklmnopqrstuvwxyz"];
  keyEl.innerHTML = AZ.map(c => `<label class="wt-key"><span>${c.toUpperCase()}</span><input type="text" maxlength="1" data-c="${c}" autocomplete="off" aria-label="Cipher ${c.toUpperCase()} stands for"></label>`).join("");
  const inputs = () => [...keyEl.querySelectorAll("input")];
  const getKey = () => Object.fromEntries(inputs().filter(i => /^[a-z]$/i.test(i.value)).map(i => [i.dataset.c, i.value.toLowerCase()]));
  function setKey(k) { inputs().forEach(i => { i.value = (k[i.dataset.c] || "").toUpperCase(); }); refresh(); }
  const text = () => $("#cipher").value;

  function decoded(k) {
    return text().replace(/[a-z]/gi, ch => { const p = k[ch.toLowerCase()]; return p ? (ch === ch.toUpperCase() ? p.toUpperCase() : p) : "_"; });
  }
  function refresh() {
    const k = getKey();
    const used = {};
    for (const [c, p] of Object.entries(k)) (used[p] = used[p] || []).push(c);
    inputs().forEach(i => i.classList.toggle("clash", !!i.value && used[i.value.toLowerCase()]?.length > 1));
    const t = text();
    $("#plain").textContent = t.trim() ? decoded(k) : "";
    const counts = {};
    for (const ch of t.toLowerCase()) if (ch >= "a" && ch <= "z") counts[ch] = (counts[ch] || 0) + 1;
    inputs().forEach(i => { i.closest(".wt-key").dataset.n = counts[i.dataset.c] || 0; });
    setParams({ t: t.slice(0, 400), k: Object.entries(k).map(([c, p]) => c + p).join("") });
  }
  keyEl.addEventListener("input", e => {
    const i = e.target; i.value = i.value.replace(/[^a-z]/gi, "").toUpperCase();
    refresh();
    if (i.value) { const all = inputs(); const next = all.slice(all.indexOf(i) + 1).find(x => x.closest(".wt-key").dataset.n > 0 && !x.value); next?.focus(); }
  });
  $("#cipher").addEventListener("input", refresh);

  function solve(suggest) {
    if (!text().trim()) { out.innerHTML = emptyHtml; return; }
    const k = getKey();
    T.run(out, async current => {
      const r = await T.compute("cryptogram", text(), k, { limit: 40 });
      if (!current()) return;
      if (suggest) { setKey(r.suggestion); }
      out.innerHTML = `<p class="summary">${suggest ? `Suggested key: ${r.solved} of ${r.solvable} word${r.solvable === 1 ? "" : "s"} become real words${r.complete ? "" : " (best found in the time allowed)"}. Check it reads as English; fix any letter and solve again.` : `${r.words.length} different cipher words.`}</p>
        <section class="group" data-len="5"><h3>Candidates for each word</h3><p class="hint">Words that fit the letter pattern and the key so far, everyday words first. Tap one to put its letters in the key.</p>
        <ul class="wt-cands">${r.words.map(w => `<li><b>${esc(w.word.toUpperCase())}</b> <small>${w.total.toLocaleString()} fit${w.total === 1 ? "s" : ""}</small><div class="words">${w.candidates.map(p => `<button type="button" class="word plain" data-c="${esc(w.word)}" data-p="${esc(p)}">${esc(p)}</button>`).join("") || `<span class="hint">None: a name, or a word not in the list.</span>`}</div></li>`).join("")}</ul></section>`;
    });
  }
  out.addEventListener("click", e => {
    const b = e.target.closest("[data-p]");
    if (!b) return;
    const k = getKey(), c = b.dataset.c, p = b.dataset.p;
    for (let i = 0; i < c.length; i++) k[c[i]] = p[i];
    setKey(k);
    solve(false);
  });
  $("#form").addEventListener("submit", e => { e.preventDefault(); solve(false); });
  $("#suggest").addEventListener("click", () => solve(true));
  $("#clearKey").addEventListener("click", () => { setKey({}); solve(false); });
  const q = getParams();
  if (q.t) { $("#cipher").value = q.t; const k = {}; for (let i = 0; i + 1 < (q.k || "").length; i += 2) k[q.k[i]] = q.k[i + 1]; setKey(k); solve(false); }
  else refresh();
})();
