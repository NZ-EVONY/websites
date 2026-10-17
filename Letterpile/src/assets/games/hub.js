/* Daily games hub and the home page band: today's status on each game card, the countdown,
   and links to the last week's puzzles (the archive). */
(function () {
  "use strict";
  const G = window.Games;
  if (!G) return;
  const LABEL = { new: "Today's puzzle is ready", playing: "In progress: pick up where you left off", solved: "Solved today ✓", lost: "Played today", none: "Come back soon: no puzzle yet today" };
  const SHORT = { new: "Not played", playing: "In progress", solved: "Solved ✓", lost: "Played" };
  G.countdown();

  // "All games today" and the all-games streak: a day counts when every game that had a puzzle
  // that day was finished (solved, or played to the end). Today only extends the streak once done.
  function allGames(m) {
    const box = document.querySelector("[data-all-games]");
    if (!box) return;
    const games = [...document.querySelectorAll("[data-game-card]")].map(c => c.dataset.gameCard);
    const finished = (d, g) => ["solved", "lost"].includes(G.status(g, d));
    const due = d => games.filter(g => (m.games?.[g] || []).includes(d));
    const complete = d => { const gs = due(d); return gs.length > 0 && gs.every(g => finished(d, g)); };
    const t = G.today(), todays = due(t), done = todays.filter(g => finished(t, g)).length;
    box.querySelector("[data-done]").textContent = done;
    box.querySelector("[data-total]").textContent = todays.length;
    box.querySelector("[data-meter]").style.setProperty("--w", `${todays.length ? Math.round(100 * done / todays.length) : 0}%`);
    // Walk back through the days that had puzzles (up to a year).
    let streak = 0, best = 0, run = 0, broken = false;
    for (let i = 0; i < 366; i++) {
      const d = G.addDays(t, -i);
      if (!due(d).length) { if (i > 7) break; continue; }
      if (complete(d)) { run++; if (!broken) streak = run; best = Math.max(best, run); }
      else if (i > 0) { broken = true; run = 0; } // an unfinished today doesn't break the streak yet
    }
    box.querySelector("[data-streak]").textContent = streak;
    box.querySelector("[data-streak-s]").textContent = streak === 1 ? "" : "s";
    box.querySelector("[data-best]").textContent = best;
  }
  G.manifest().then(m => {
    const t = G.today();
    document.querySelectorAll("[data-game-card]").forEach(card => {
      const game = card.dataset.gameCard;
      const has = (m.games?.[game] || []).includes(t);
      if (card.hasAttribute("data-optional")) card.hidden = !has; // e.g. the crossword while it's restocked
      const s = has ? G.status(game, t) : "none";
      card.dataset.state = s;
      const el = card.querySelector("[data-status]");
      if (el) el.textContent = LABEL[s];
    });
    allGames(m);
    const arch = document.querySelector("[data-archive]");
    if (!arch) return;
    const cards = [...document.querySelectorAll("[data-game-card]")].filter(c => !c.hidden || (m.games?.[c.dataset.gameCard] || []).length).map(c => c.dataset.gameCard);
    arch.innerHTML = cards.map(game => {
      const card = document.querySelector(`[data-game-card="${game}"] a`); // its text is the game's name
      const dates = G.archiveDates(m.games?.[game] || []);
      return `<section><h3>${card.textContent}</h3>${dates.length ? `<ul>${dates.map(d => `<li><a href="${card.getAttribute("href")}?date=${d}">${G.longDate(d)}</a> <span class="hint">${SHORT[G.status(game, d)]}</span></li>`).join("")}</ul>` : `<p class="hint">No earlier puzzles yet.</p>`}</section>`;
    }).join("");
  });
})();
