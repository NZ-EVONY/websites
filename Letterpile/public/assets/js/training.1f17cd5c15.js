(function () {
  "use strict";
  const { $, esc, compute, withWords } = UI;
  const root = $("#train");
  if (!root) return;
  const D = JSON.parse(root.dataset.train);
  const KEY = "lp-train";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  let P = Object.assign({ two: {}, three: {}, q: {}, best: 0 }, load());
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch {} };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = s => { const a = [...s]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.join(""); };

  const tabs = [...root.querySelectorAll('[role="tab"]')];
  tabs.forEach(t => t.addEventListener("click", () => {
    tabs.forEach(x => { x.setAttribute("aria-selected", String(x === t)); $("#" + x.getAttribute("aria-controls")).hidden = x !== t; });
  }));

  const VOW = "aeiou", AZ = "abcdefghijklmnopqrstuvwxyz";
  function quiz(pane) {
    const kind = pane.dataset.quiz, list = D[kind], set = new Set(list), n = list[0].length;
    const shown = pane.querySelector("[data-word-shown]"), fb = pane.querySelector("[data-feedback]"), prog = pane.querySelector("[data-progress]");
    let cur = null;
    const mastered = () => list.filter(w => (P[kind][w] || 0) >= 3).length;
    const fake = () => { for (;;) { let s = ""; for (let i = 0; i < n; i++) s += i === 1 || (n === 2 && i === 0 && Math.random() < .5) ? pick(VOW) : pick(AZ); if (!set.has(s) && /[aeiouy]/.test(s)) return s; } };
    const next = () => {
      const todo = list.filter(w => (P[kind][w] || 0) < 3);
      cur = Math.random() < .5 ? { w: pick(todo.length ? todo : list), real: true } : { w: fake(), real: false };
      shown.textContent = cur.w.toUpperCase();
      prog.textContent = `Mastered ${mastered()} of ${list.length}.`;
    };
    pane.addEventListener("click", e => {
      const b = e.target.closest("[data-answer]");
      if (!b || !cur) return;
      const right = (b.dataset.answer === "yes") === cur.real;
      if (cur.real) P[kind][cur.w] = right ? (P[kind][cur.w] || 0) + 1 : 0;
      save();
      fb.innerHTML = `${right ? "Right" : "Not quite"}: ${cur.real ? `<button type="button" class="word plain" data-word="${cur.w}">${cur.w.toUpperCase()}</button> is a word.` : `${cur.w.toUpperCase()} isn't in the list.`}`;
      fb.dataset.right = right;
      next();
    });
    next();
  }
  root.querySelectorAll("[data-quiz]").forEach(quiz);

  let rack = "", found = [], left = 0, tick = null;
  const an = id => $("#an" + id);
  const fits = w => { const r = [...rack]; for (const c of w) { const i = r.indexOf(c); if (i < 0) return false; r.splice(i, 1); } return true; };
  an("Best").textContent = P.best ? `Best score: ${P.best} words.` : "Best score: none yet.";
  an("Start").addEventListener("click", () => {
    rack = shuffle(pick(D.racks)); found = []; left = 60;
    an("Rack").textContent = rack.toUpperCase().split("").join(" ");
    an("Found").innerHTML = ""; an("Result").innerHTML = ""; an("Feedback").textContent = "";
    an("Score").textContent = "0 words";
    an("Input").disabled = an("Add").disabled = false; an("Start").disabled = true;
    an("Input").focus();
    compute("isWord", "a").catch(() => {});
    clearInterval(tick);
    tick = setInterval(() => { left--; an("Clock").textContent = `0:${String(Math.max(left, 0)).padStart(2, "0")}`; if (left <= 0) stop(); }, 1000);
    an("Clock").textContent = "1:00";
  });
  an("Form").addEventListener("submit", async e => {
    e.preventDefault();
    const w = an("Input").value.toLowerCase().replace(/[^a-z]/g, "");
    an("Input").value = "";
    const say = t => { an("Feedback").textContent = t; };
    if (w.length < 3) return say("Words need three letters or more.");
    if (!fits(w)) return say(`${w.toUpperCase()} uses letters that aren't in the rack.`);
    if (found.includes(w)) return say(`You already have ${w.toUpperCase()}.`);
    if (!(await compute("isVisibleWord", w))) return say(`${w.toUpperCase()} isn't in the word list.`);
    if (left <= 0) return;
    found.push(w);
    an("Found").insertAdjacentHTML("beforeend", `<span class="word plain static">${esc(w)}</span>`);
    an("Score").textContent = `${found.length} word${found.length === 1 ? "" : "s"}`;
    say(`${w.toUpperCase()}: yes!`);
  });
  function stop() {
    clearInterval(tick);
    an("Input").disabled = an("Add").disabled = true; an("Start").disabled = false;
    if (found.length > P.best) { P.best = found.length; save(); }
    an("Best").textContent = `Best score: ${P.best} words.`;
    withWords(an("Result"), async current => {
      const all = (await compute("unscramble", rack)).map(x => x.word).filter(w => w.length >= 3);
      if (!current()) return;
      const missed = all.filter(w => !found.includes(w)).sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
      an("Result").innerHTML = `<p class="summary">Time's up: you found ${found.length} of ${all.length} words.</p>${missed.length ? `<p>Longest you missed:</p><div class="words">${missed.slice(0, 12).map(w => `<button type="button" class="word" data-word="${w}">${w}</button>`).join("")}</div>` : "<p>You found every one!</p>"}`;
    });
  }

  let card = null;
  const qNext = () => {
    const todo = D.noU.filter(w => !P.q[w]);
    card = pick(todo.length ? todo : D.noU);
    $("#qFront").textContent = shuffle(card).toUpperCase().split("").join(" ");
    $("#qHint").textContent = `${card.length} letters, starting with ${card[0].toUpperCase()}`;
    $("#qKnew").disabled = $("#qMissed").disabled = true; $("#qFlip").disabled = false;
    $("#qProgress").textContent = `Known ${D.noU.filter(w => P.q[w]).length} of ${D.noU.length}.`;
  };
  $("#qFlip").addEventListener("click", () => { $("#qFront").textContent = card.toUpperCase(); $("#qKnew").disabled = $("#qMissed").disabled = false; $("#qFlip").disabled = true; });
  $("#qKnew").addEventListener("click", () => { P.q[card] = 1; save(); qNext(); });
  $("#qMissed").addEventListener("click", () => { delete P.q[card]; save(); qNext(); });
  qNext();

  $("#trainReset").addEventListener("click", () => {
    if (!confirm("Reset all your training progress?")) return;
    P = { two: {}, three: {}, q: {}, best: 0 }; save(); location.reload();
  });
})();
