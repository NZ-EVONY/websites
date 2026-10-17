/* Word of the Day page: today's word (or an archive day's, with ?date=) and links to the last
   week's words. */
(function () {
  "use strict";
  const G = window.Games, $ = s => document.querySelector(s);
  if (!G || !$("#wotd")) return;
  const set = (id, t) => { $(id).textContent = t; };
  async function init() {
    const res = await G.open("wotd");
    const p = res.puzzle;
    if (!p) { G.comeBackSoon($("#wotd")); }
    else {
      set("#wdWord", p.word.toUpperCase());
      set("#wdMeaning", p.meaning);
      set("#wdUsage", p.usage);
      set("#wdFact", p.fact);
      set("#wdPoints", `${p.points} points`);
      $("#wdPage").href = `/word/${p.word}`;
      $("#wdPage").textContent = `Anagrams, hooks and rhymes for ${p.word.toUpperCase()}`;
      G.save(G.key("wotd", res.date), { done: true, won: true });
      const days = G.archiveDates(res.dates || []).filter(d => d !== res.date);
      const words = await Promise.all(days.map(d => fetch(`/puzzles/wotd/${d}.json`).then(r => r.json()).catch(() => null)));
      $("#wdArchive").innerHTML = days.length ? days.map((d, i) => `<li><a href="/word-of-the-day?date=${d}">${G.longDate(d)}</a>${words[i] ? `: <b>${words[i].word.toUpperCase()}</b>` : ""}</li>`).join("") : `<li class="hint">No earlier words yet.</li>`;
    }
    $("#game").dataset.ready = "1";
  }
  init();
})();
