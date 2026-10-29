(function () {
  "use strict";
  const { $, esc, getParams, setParams } = UI;
  const root = $("[data-rhymes]"), out = $("#results"), emptyHtml = out.innerHTML;
  let counts = null;
  function load() {
    if (counts) return Promise.resolve(counts);
    return fetch(root.dataset.rhymes).then(r => { if (!r.ok) throw new Error("Couldn't load the pronunciation list."); return r.json(); }).then(groups => {
      counts = new Map();
      for (const [, list] of groups) for (const s of list.split(" ")) counts.set(s.slice(1), +s[0]);
      return counts;
    });
  }
  function estimate(w) {
    if (w.length <= 3) return 1;
    let s = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, m => m[0]).replace(/^y/, "");
    const n = (s.match(/[aeiouy]+/g) || []).length;
    return Math.max(1, n);
  }
  function count(word) {
    const w = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!w) return null;
    if (counts.has(w)) return { n: counts.get(w), sure: true };
    if (w === "a" || w === "i") return { n: 1, sure: true }; // not in the word list, which starts at two letters
    return { n: estimate(w), sure: false };
  }
  function solve() {
    const text = $("#text").value;
    if (!text.trim()) { out.innerHTML = emptyHtml; return; }
    setParams({ t: text.length <= 300 ? text : "" });
    if (!counts) out.innerHTML = `<p class="loading">Loading the pronunciation list…</p>`;
    load().then(() => {
      let total = 0, words = 0, guessed = 0;
      const lines = text.split(/\r?\n/).filter(l => l.trim()).map(line => {
        let sum = 0;
        const html = line.split(/(\s+)/).map(tok => {
          if (!tok.trim()) return " ";
          const c = count(tok);
          if (!c) return esc(tok);
          sum += c.n; words++; if (!c.sure) guessed++;
          return `<span class="wt-sw">${esc(tok)}<sup${c.sure ? "" : ' title="Estimated from the spelling"'}>${c.sure ? "" : "~"}${c.n}</sup></span>`;
        }).join("");
        total += sum;
        return `<li><span class="wt-line">${html}</span><b class="wt-total">${sum}</b></li>`;
      });
      out.innerHTML = `<p class="summary">${total.toLocaleString()} syllable${total === 1 ? "" : "s"} in ${words.toLocaleString()} word${words === 1 ? "" : "s"}${lines.length > 1 ? `, ${lines.length} lines` : ""}.${guessed ? ` <small>~ marks ${guessed} estimate${guessed === 1 ? "" : "s"} for words not in the pronunciation list.</small>` : ""}</p>
        <ol class="wt-syl">${lines.join("")}</ol>`;
    }).catch(e => { out.innerHTML = `<p class="error">${esc(e.message)} Check your connection and try again.</p>`; });
  }
  let t = null;
  $("#text").addEventListener("input", () => { clearTimeout(t); t = setTimeout(solve, 250); });
  $("#form").addEventListener("submit", e => { e.preventDefault(); solve(); });
  const q = getParams();
  if (q.t) { $("#text").value = q.t; solve(); }
})();
