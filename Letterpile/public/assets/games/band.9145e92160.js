(function () {
  "use strict";
  const LABEL = { playing: "In progress: pick up where you left off", solved: "Solved today ✓", lost: "Played today" };
  const day = () => new Date().toISOString().slice(0, 10);
  const t = day();
  document.querySelectorAll("[data-game-card]").forEach(card => {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(`lp-game:${card.dataset.gameCard}:${t}`)); } catch {}
    const k = !s ? null : s.done ? (s.won === false ? "lost" : "solved") : "playing";
    if (k) { card.dataset.state = k; card.querySelector("[data-status]").textContent = LABEL[k]; }
  });
  const optional = document.querySelectorAll("[data-game-card][data-optional]");
  if (optional.length) fetch("/puzzles/manifest.json").then(r => r.json()).then(m => {
    optional.forEach(card => { card.hidden = !(m.games?.[card.dataset.gameCard] || []).includes(t); });
  }).catch(() => {});
  const els = document.querySelectorAll("[data-countdown]");
  const tick = () => {
    const s = Math.floor((86400000 - Date.now() % 86400000) / 1000);
    const txt = [s / 3600, s / 60 % 60, s % 60].map(n => String(Math.floor(n)).padStart(2, "0")).join(":");
    els.forEach(el => { el.textContent = txt; });
  };
  tick();
  setInterval(tick, 1000);
})();
