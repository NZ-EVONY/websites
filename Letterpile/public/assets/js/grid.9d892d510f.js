(function () {
  "use strict";
  const { $, esc, getParams, setParams } = UI;
  const T = WordToolsClient;
  const out = $("#results"), gridEl = $("#grid"), emptyHtml = out.innerHTML;
  let n = 4, found = [];
  const cells = () => [...gridEl.querySelectorAll("input")];

  function build(letters = "") {
    gridEl.style.setProperty("--n", n);
    gridEl.innerHTML = Array.from({ length: n * n }, (_, i) => `<input type="text" class="wt-cell" maxlength="2" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Row ${Math.floor(i / n) + 1}, column ${i % n + 1}" value="${esc(show(letters[i] || ""))}">`).join("");
  }
  const show = ch => (ch === "q" ? "Qu" : ch.toUpperCase());
  const tiles = () => cells().map(c => c.value.toLowerCase().replace(/[^a-z]/g, "")[0] || "");
  gridEl.addEventListener("input", e => {
    const c = e.target, ch = c.value.toLowerCase().replace(/[^a-z]/g, "").slice(-1);
    c.value = ch ? show(ch) : "";
    clearPath();
    if (ch) { const all = cells(), i = all.indexOf(c); all[i + 1]?.focus(); all[i + 1]?.select(); }
  });
  gridEl.addEventListener("keydown", e => {
    const all = cells(), i = all.indexOf(e.target);
    const go = j => { if (all[j]) { e.preventDefault(); all[j].focus(); all[j].select(); } };
    if (e.key === "Backspace" && !e.target.value) go(i - 1);
    else if (e.key === "ArrowRight") go(i + 1); else if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "ArrowDown") go(i + n); else if (e.key === "ArrowUp") go(i - n);
  });
  $("#quick").addEventListener("input", () => {
    const v = $("#quick").value.toLowerCase().replace(/qu/g, "q").replace(/[^a-z]/g, "");
    if (v.length === 25 && n === 4) { n = 5; $("#size").value = "5"; }
    build(v);
  });
  $("#size").addEventListener("change", () => { const t = tiles().join(""); n = +$("#size").value; build(t); out.innerHTML = emptyHtml; });

  function clearPath() { cells().forEach(c => { c.classList.remove("on"); c.removeAttribute("data-step"); }); $("#path").textContent = ""; out.querySelectorAll(".word.on").forEach(b => b.classList.remove("on")); }
  function showPath(i) {
    clearPath();
    const m = found[i], all = cells();
    m.path.forEach((k, j) => { all[k].classList.add("on"); all[k].dataset.step = j + 1; });
    out.querySelector(`[data-i="${i}"]`)?.classList.add("on");
    $("#path").textContent = `${m.word.toUpperCase()}: ${m.path.map(k => all[k].value).join(" → ")}`;
  }
  out.addEventListener("click", e => { const b = e.target.closest("[data-i]"); if (b) showPath(+b.dataset.i); });

  function solve() {
    const t = tiles();
    if (t.some(x => !x)) { out.innerHTML = `<p class="empty">Fill in every square first (${t.filter(Boolean).length} of ${n * n} so far).</p>`; return; }
    setParams({ g: t.join("") });
    const rows = Array.from({ length: n }, (_, r) => t.slice(r * n, r * n + n).map(ch => (ch === "q" ? "qu" : ch)));
    T.run(out, async current => {
      const res = await T.compute("grid", rows, { min: +$("#min").value });
      if (!current()) return;
      found = res;
      clearPath();
      if (!res.length) { out.innerHTML = `<p class="empty">No words found in this grid.</p>`; return; }
      const byLen = new Map();
      res.forEach((x, i) => { const k = Math.min(x.word.length, 9); if (!byLen.has(k)) byLen.set(k, []); byLen.get(k).push(i); });
      out.innerHTML = `<p class="summary">${res.length.toLocaleString()} ${res.length === 1 ? "word" : "words"}. <small>Tap a word to see its path.</small></p>` +
        [...byLen].map(([k, is]) => `<section class="group" data-len="${k}"><h3>${k === 9 ? "9 or more letters" : `${k}-letter words`} <span class="count">${is.length}</span></h3><div class="words">${is.map(i => `<button type="button" class="word" data-i="${i}" aria-label="${esc(res[i].word)}: show path">${esc(res[i].word)}</button>`).join("")}</div></section>`).join("");
    });
  }
  $("#form").addEventListener("submit", e => { e.preventDefault(); solve(); });
  $("#clearGrid").addEventListener("click", () => { build(""); $("#quick").value = ""; out.innerHTML = emptyHtml; found = []; cells()[0].focus(); });
  T.onFilter(() => { if (found.length) solve(); });
  const q = getParams();
  const g = (q.g || "").toLowerCase().replace(/[^a-z]/g, "");
  if (g.length === 25) { n = 5; $("#size").value = "5"; }
  build(g);
  if (g.length === n * n) solve();
})();
