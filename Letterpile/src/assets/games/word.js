/* Daily Word player: six guesses at a five-letter word. Progress is saved per day; statistics
   (played, win %, streaks, guess distribution) only count today's puzzle, not archive games. */
(function () {
  "use strict";
  const G = window.Games, $ = s => document.querySelector(s);
  const root = $(".word-game");
  if (!G || !root) return;
  const board = $("#board"), keys = $("#keys"), msg = $("#wordMsg"), statsEl = $("#wordStats"), statsBtn = $("#statsBtn"), shareRow = statsEl.querySelector("[data-share]");
  const rows = [...board.children];
  const STATS = "lp-game:word:stats";
  const NAME = { g: "correct", y: "in the word, wrong spot", b: "not in the word" };
  let date, archive, answer, number, valid = null, st = { guesses: [], done: false }, cur = "", busy = false;

  const say = t => { msg.textContent = t; };

  // Feedback for one guess: g (right spot), y (elsewhere), b (absent), counting repeats.
  function marks(guess) {
    const m = Array(5).fill("b"), left = {};
    for (let i = 0; i < 5; i++) { if (guess[i] === answer[i]) m[i] = "g"; else left[answer[i]] = (left[answer[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) if (m[i] !== "g" && left[guess[i]] > 0) { m[i] = "y"; left[guess[i]]--; }
    return m;
  }

  function paintRow(r, word, m) {
    const tiles = rows[r].children;
    for (let i = 0; i < 5; i++) {
      const t = tiles[i];
      t.textContent = word[i] || "";
      t.className = "dw-tile" + (word[i] ? " filled" : "") + (m ? ` m-${m[i]}` : "");
      t.setAttribute("aria-label", word[i] ? `${word[i].toUpperCase()}${m ? `, ${NAME[m[i]]}` : ""}` : "empty");
    }
  }
  function paintKeys() {
    const best = {};
    const rank = { g: 3, y: 2, b: 1 };
    for (const g of st.guesses) marks(g).forEach((m, i) => { if ((rank[m] || 0) > (rank[best[g[i]]] || 0)) best[g[i]] = m; });
    keys.querySelectorAll("[data-key]").forEach(k => {
      const m = best[k.dataset.key];
      k.classList.remove("m-g", "m-y", "m-b");
      if (m) k.classList.add(`m-${m}`);
      if (k.dataset.key.length === 1) k.setAttribute("aria-label", k.dataset.key.toUpperCase() + (m ? `, ${NAME[m]}` : ""));
    });
  }
  function paint() {
    st.guesses.forEach((g, r) => paintRow(r, g, marks(g)));
    for (let r = st.guesses.length; r < 6; r++) paintRow(r, r === st.guesses.length && !st.done ? cur : "", null);
    paintKeys();
  }

  // ---------- statistics ----------

  const blank = () => ({ played: 0, won: 0, cur: 0, max: 0, dist: [0, 0, 0, 0, 0, 0], last: null });
  const stats = () => Object.assign(blank(), G.load(STATS, {}));
  function record(won, n) {
    if (archive) return;
    const s = stats();
    if (s.last === date) return;
    s.played++;
    if (won) {
      s.won++; s.dist[n - 1]++;
      s.cur = s.lastWin === G.addDays(date, -1) ? s.cur + 1 : 1;
      s.max = Math.max(s.max, s.cur); s.lastWin = date;
    } else s.cur = 0;
    s.last = date;
    G.save(STATS, s);
  }
  function showStats(open) {
    const s = stats();
    // A streak lapses if the last win was before yesterday.
    const cur = s.lastWin && s.lastWin >= G.addDays(G.today(), -1) ? s.cur : 0;
    const set = (k, v) => { statsEl.querySelector(`[data-stat="${k}"]`).textContent = v; };
    set("played", s.played); set("pct", s.played ? Math.round(100 * s.won / s.played) : 0); set("cur", cur); set("max", s.max);
    const top = Math.max(1, ...s.dist);
    s.dist.forEach((n, i) => {
      const bar = statsEl.querySelector(`[data-dist="${i + 1}"]`);
      bar.textContent = n;
      bar.style.setProperty("--w", `${Math.max(8, Math.round(100 * n / top))}%`);
      bar.classList.toggle("now", st.done && st.won && st.guesses.length === i + 1);
    });
    shareRow.hidden = !st.done;
    if (open != null) { statsEl.hidden = !open; statsBtn.setAttribute("aria-expanded", String(open)); }
  }
  statsBtn.addEventListener("click", () => showStats(statsEl.hidden));

  function shareText() {
    const grid = st.guesses.map(g => marks(g).map(m => ({ g: "🟩", y: "🟨", b: "⬜" })[m]).join("")).join("\n");
    return `Letterpile Daily Word #${number} ${st.won ? st.guesses.length : "X"}/6\n${grid}\nletterpile.app/games/word`;
  }
  G.shareBar(shareRow, shareText, "/games/word");

  // ---------- input ----------

  function finish() {
    st.done = true;
    st.won = st.guesses.at(-1) === answer;
    G.save(G.key("word", date), st);
    record(st.won, st.guesses.length);
    say(st.won ? ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"][st.guesses.length - 1] + ` Solved in ${st.guesses.length}.` : `The word was ${answer.toUpperCase()}. Better luck tomorrow.`);
    showStats(true);
  }
  function submit() {
    if (cur.length < 5) { say("Not enough letters."); shake(); return; }
    if (valid && !valid.has(cur)) { say(`${cur.toUpperCase()} isn't in the word list.`); shake(); return; }
    st.guesses.push(cur);
    cur = "";
    G.save(G.key("word", date), st);
    const r = st.guesses.length - 1;
    paint();
    rows[r].classList.add("reveal");
    const m = marks(st.guesses[r]);
    if (st.guesses[r] === answer || st.guesses.length === 6) finish();
    else say(`Guess ${r + 1}: ${m.map((x, i) => `${st.guesses[r][i].toUpperCase()} ${NAME[x]}`).join(", ")}.`);
  }
  function shake() {
    const row = rows[st.guesses.length];
    row.classList.remove("shake"); void row.offsetWidth; row.classList.add("shake");
  }
  function press(k) {
    if (st.done || busy || !answer) return;
    if (k === "Enter") submit();
    else if (k === "Backspace") cur = cur.slice(0, -1);
    else if (/^[a-z]$/.test(k) && cur.length < 5) cur += k;
    if (!st.done) paint();
  }
  keys.addEventListener("click", e => { const b = e.target.closest("[data-key]"); if (b) press(b.dataset.key); });
  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest("input, textarea, select, dialog[open], summary, a")) return;
    // Enter on a focused on-screen key presses that key (a click); don't also submit.
    if (e.key === "Enter" && e.target.closest("button")) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === "Enter" || k === "Backspace" || /^[a-z]$/.test(k)) { e.preventDefault(); press(k); }
  });

  // ---------- start ----------

  G.open("word").then(async res => {
    ({ date, archive } = res);
    if (!res.puzzle) { G.comeBackSoon(root); return; }
    answer = G.decode(res.puzzle.a, `word:${date}`);
    number = res.puzzle.number;
    st = G.state("word", date) || st;
    paint();
    if (st.done) finish();
    document.getElementById("game").dataset.ready = "1";
    fetch(root.dataset.guesses).then(r => r.json()).then(list => { valid = new Set(list); valid.add(answer); }).catch(() => {});
  });
})();
