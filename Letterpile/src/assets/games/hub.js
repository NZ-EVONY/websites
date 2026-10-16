/* Daily games hub and the home page band: today's status on each game card, the countdown,
   and links to the last week's puzzles (the archive). */
(function () {
  "use strict";
  const G = window.Games;
  if (!G) return;
  const LABEL = { new: "Today's puzzle is ready", playing: "In progress: pick up where you left off", solved: "Solved today ✓", lost: "Played today", none: "Come back soon: no puzzle yet today" };
  const SHORT = { new: "Not played", playing: "In progress", solved: "Solved ✓", lost: "Played" };
  G.countdown();
  G.manifest().then(m => {
    const t = G.today();
    document.querySelectorAll("[data-game-card]").forEach(card => {
      const game = card.dataset.gameCard;
      const s = (m.games?.[game] || []).includes(t) ? G.status(game, t) : "none";
      card.dataset.state = s;
      const el = card.querySelector("[data-status]");
      if (el) el.textContent = LABEL[s];
    });
    const arch = document.querySelector("[data-archive]");
    if (!arch) return;
    const cards = [...document.querySelectorAll("[data-game-card]")].map(c => c.dataset.gameCard);
    arch.innerHTML = cards.map(game => {
      const card = document.querySelector(`[data-game-card="${game}"] a`);
      const dates = G.archiveDates(m.games?.[game] || []);
      return `<section><h3>${G.NAMES[game]}</h3>${dates.length ? `<ul>${dates.map(d => `<li><a href="${card.getAttribute("href")}?date=${d}">${G.longDate(d)}</a> <span class="hint">${SHORT[G.status(game, d)]}</span></li>`).join("")}</ul>` : `<p class="hint">No earlier puzzles yet.</p>`}</section>`;
    }).join("");
  });
})();
