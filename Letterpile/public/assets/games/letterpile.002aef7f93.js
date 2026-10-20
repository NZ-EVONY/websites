/* Letterpile player (daily, practice and arcade). Tiles are absolutely placed by column and row
   (CSS custom properties), so removing a word just changes rows and the CSS transition makes the
   tiles above fall; a moment later, empty columns close up and the columns to their right slide
   left. Progress (daily) is the list of moves, replayed from the day's board. */
(function () {
  "use strict";
  const G = window.Games, LP = window.LP, $ = s => document.querySelector(s);
  const root = $(".lp-game");
  if (!G || !LP || !root) return;
  const mode = root.dataset.mode, daily = mode === "daily", arcade = mode === "arcade";
  const N = arcade ? 6 : 5;
  const boardEl = $("#lpBoard"), msg = $("#lpMsg"), wordEl = $("#lpWord"), submitBtn = $("#lpSubmit");
  const say = t => { msg.textContent = t; };
  const STATS = "lp-game:letterpile:stats", SETTINGS = "lp-game:letterpile:settings", SEEN = "lp-game:letterpile:seen", BEST = "lp-game:letterpile:arcade-best";
  const SQUARE = n => (n <= 3 ? "🟨" : n === 4 ? "🟩" : n === 5 ? "🟦" : "🟪");

  let dict = null, wordList = null, dead = new Set(), busy = false, date, puzzle, start, solution = [], par = 0;
  let cols, ids, nextId = 0, moves = [], hints = 0, path = [], done = false, timer = null, rnd = Math.random;
  let score = 0, movesLeft = 8, hinted = null;


  const script = src => new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.append(s);
  });
  function loadWords() {
    return (self.WORD_DATA ? Promise.resolve() : script(root.dataset.wordlist)).then(() => {
      const hide = new Set((self.WORD_HIDE || "").split(" "));
      wordList = self.WORD_DATA.split(" ").filter(w => w.length >= 3 && !hide.has(w));
      dict = LP.dictionary(wordList);
      findDead(); draw();
      submitBtn.disabled = path.length < 3;
    });
  }


  const tileEl = id => boardEl.querySelector(`[data-id="${id}"]`);
  function draw(fresh = []) {
    const live = new Set();
    cols.forEach((col, c) => col.forEach((ch, r) => {
      const id = ids[c][r];
      live.add(String(id));
      let el = tileEl(id);
      if (!el) {
        el = document.createElement("button");
        el.type = "button"; el.className = "tile lp-tile"; el.dataset.id = id;
        el.innerHTML = `${ch}<sup>${LP.VALUES[ch]}</sup>`;
        el.style.setProperty("--c", c);
        el.style.setProperty("--r", fresh.includes(id) ? r + N : r); // new tiles start above and drop in
        boardEl.append(el);
        if (fresh.includes(id)) requestAnimationFrame(() => requestAnimationFrame(() => el.style.setProperty("--r", r)));
      } else { el.style.setProperty("--c", c); el.style.setProperty("--r", r); }
      el.dataset.c = c; el.dataset.r = r;
      const inPath = path.findIndex(p => p[0] === c && p[1] === r);
      el.classList.toggle("on", inPath >= 0);
      el.classList.toggle("hint", !!hinted && hinted[0] === c && hinted[1] === r);
      el.classList.toggle("dead", dead.has(ch));
      el.setAttribute("aria-pressed", String(inPath >= 0));
      el.setAttribute("aria-label", `${ch.toUpperCase()}, ${LP.VALUES[ch]} point${LP.VALUES[ch] === 1 ? "" : "s"}, column ${c + 1}, row ${N - r} from the top${dead.has(ch) ? ", can't be reached any more" : ""}${inPath >= 0 ? `, letter ${inPath + 1} of your word` : ""}`);
    }));
    boardEl.querySelectorAll(".lp-tile").forEach(el => { if (!live.has(el.dataset.id)) { el.classList.add("gone"); setTimeout(() => el.remove(), 250); } });
    $("#lpNote").hidden = !cols.some(col => col.some(ch => dead.has(ch)));
    const w = LP.word(cols, path);
    wordEl.textContent = w.toUpperCase();
    submitBtn.disabled = done || w.length < 3;
    status();
  }
  function status() {
    const el = $("#lpScore");
    if (arcade) el.textContent = `Score ${score} · ${movesLeft} word${movesLeft === 1 ? "" : "s"} left`;
    else el.textContent = `Words ${moves.length} · Par ${par}`;
    $("#lpPlayed").innerHTML = moves.map(m => `<li>${m.word.toUpperCase()}${arcade ? ` <span class="hint">+${m.points}</span>` : ""}</li>`).join("");
    const hb = $("#lpHint");
    if (hb) { hb.disabled = done || hints >= 3; hb.textContent = `Hint (${3 - hints} left)`; }
  }


  const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
  function tap(cell) {
    if (done || busy) return;
    hinted = null;
    const i = path.findIndex(p => same(p, cell));
    if (i === path.length - 1 && i >= 0) path.pop();
    else if (i >= 0) path = path.slice(0, i + 1);
    else if (!path.length || LP.adjacent(path[path.length - 1], cell)) path.push(cell);
    else path = [cell];
    draw();
  }
  const cellOf = el => (el && el.classList.contains("lp-tile") ? [+el.dataset.c, +el.dataset.r] : null);
  let dragging = false, moved = false, downCell = null;
  boardEl.addEventListener("pointerdown", e => {
    const cell = cellOf(e.target.closest(".lp-tile"));
    if (!cell || done || busy) return;
    e.preventDefault();
    dragging = true; moved = false; downCell = cell;
    boardEl.setPointerCapture?.(e.pointerId);
  });
  boardEl.addEventListener("pointermove", e => {
    if (!dragging) return;
    const cell = cellOf(document.elementFromPoint(e.clientX, e.clientY)?.closest(".lp-tile"));
    if (!cell) return;
    if (!moved && !same(cell, downCell)) { moved = true; path = [downCell]; hinted = null; }
    if (!moved) return;
    if (same(cell, path[path.length - 2])) { path.pop(); draw(); return; }
    if (!path.some(p => same(p, cell)) && LP.adjacent(path[path.length - 1], cell)) { path.push(cell); draw(); }
  });
  boardEl.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    if (moved) { if (path.length >= 3) play(); else draw(); } else tap(downCell);
  });
  boardEl.addEventListener("pointercancel", () => { dragging = false; });

  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey || done || busy) return;
    if (e.target.closest("input, textarea, select, dialog[open]")) return;
    const k = e.key;
    if (k === "Enter" && !e.target.closest("button")) { e.preventDefault(); play(); }
    else if (k === "Backspace") { e.preventDefault(); if (path.length) { path.pop(); draw(); } else undo(); }
    else if (k === "Escape") { path = []; draw(); }
    else if (/^[a-zA-Z]$/.test(k)) {
      e.preventDefault();
      const ch = k.toLowerCase(), last = path[path.length - 1];
      const opts = [];
      cols.forEach((col, c) => col.forEach((x, r) => { if (x === ch && !path.some(p => same(p, [c, r])) && (!last || LP.adjacent(last, [c, r]))) opts.push([c, r]); }));
      if (opts.length === 1) { path.push(opts[0]); hinted = null; draw(); }
      else say(opts.length ? `More than one ${k.toUpperCase()} fits there: tap the one you mean.` : `No ${k.toUpperCase()} ${last ? "next to your last tile" : "on the board"}.`);
    }
  });


  const POINTS = n => [0, 0, 0, 10, 20, 40, 70, 110, 160][Math.min(n, 8)] + Math.max(0, n - 8) * 60;
  function play() {
    if (done || busy || path.length < 3) return;
    if (!dict) { say("Still loading the word list…"); return; }
    const w = LP.word(cols, path);
    if (!dict.has(w)) { say(`${w.toUpperCase()} isn't in the word list.`); boardEl.classList.remove("shake"); void boardEl.offsetWidth; boardEl.classList.add("shake"); return; }
    const m = { word: w, path: path.slice() };
    if (arcade) { m.points = POINTS(w.length); score += m.points; movesLeft--; }
    drop(m);
    moves.push(m);
    path = []; hinted = null;
    const after = () => {
      const fresh = arcade ? refill() : [];
      findDead();
      draw(fresh);
      say(`${w.toUpperCase()}${arcade ? ` +${m.points}` : ""}.`);
      save();
      check();
    };
    if (!gaps()) return after();
    draw();
    busy = true;
    setTimeout(() => { busy = false; collapse(); after(); }, 260);
  }
  function drop(m) {
    const byCol = {};
    for (const [c, r] of m.path) (byCol[c] = byCol[c] || []).push(r);
    for (const c in byCol) for (const r of byCol[c].sort((a, b) => b - a)) { cols[c].splice(r, 1); ids[c].splice(r, 1); }
  }
  const gaps = () => cols.some((col, c) => !col.length && cols.slice(c).some(x => x.length));
  function collapse() {
    const keep = cols.map((_, c) => c).filter(c => cols[c].length);
    const pad = a => { while (a.length < N) a.push([]); return a; };
    cols = pad(keep.map(c => cols[c])); ids = pad(keep.map(c => ids[c]));
  }
  const apply = m => { drop(m); collapse(); };
  function findDead() { dead = arcade || !wordList ? new Set() : LP.deadLetters(cols, wordList); }
  const FREQ = "eeeeeeeeeeeeaaaaaaaaaiiiiiiiiioooooooonnnnnnrrrrrrttttttllllssssuuuuddddgggbbccmmppffhhvvwwyykjxqz";
  function refill() {
    const fresh = [];
    cols.forEach((col, c) => { while (col.length < N) { col.push(FREQ[Math.floor(rnd() * FREQ.length)]); ids[c].push(nextId); fresh.push(nextId++); } });
    return fresh;
  }
  function check() {
    if (arcade) {
      if (!movesLeft) return finish(true);
      if (!LP.findWords(cols, dict, { limit: 1 }).length) return finish(true, "No words left on the board.");
      return;
    }
    if (!LP.count(cols)) return finish(true);
    if (dict && !LP.findWords(cols, dict, { limit: 1 }).length) finish(false);
  }

  function rebuild() {
    cols = LP.clone(start); nextId = 0;
    ids = cols.map(col => col.map(() => nextId++));
    for (const m of moves) apply(m);
    findDead();
  }
  function undo() {
    if (!moves.length || arcade && done) return;
    if (arcade) { say("Arcade words can't be undone."); return; }
    moves.pop(); done = false; path = []; hinted = null;
    $("#lpDone").hidden = true;
    rebuild(); draw(); save();
    say("Undone.");
  }
  function restart() {
    if (!moves.length && !done) return;
    moves = []; done = false; path = []; hinted = null;
    $("#lpDone").hidden = true;
    boardEl.innerHTML = "";
    rebuild(); draw(); save();
    say("Back to the start.");
  }
  function hint() {
    if (done || hints >= 3) return;
    for (const m of solution) {
      const p = LP.findPath(cols, m.word);
      if (p) { hints++; hinted = p[0]; path = []; draw(); say(`Hint: a word starts on the highlighted tile.`); save(); return; }
    }
    say("No hint fits this board now. Try undoing a word or two.");
  }


  function finish(cleared, note) {
    done = true;
    if (timer) { timer.stop(); }
    const t = timer && !$("#lpTimer").hidden ? ` in ${G.duration(timer.elapsed())}` : "";
    const left = LP.count(cols);
    $("#lpDone").hidden = false;
    if (arcade) {
      const best = Math.max(score, G.load(BEST, 0));
      G.save(BEST, best);
      $("#lpDoneTitle").textContent = "Game over";
      $("#lpDoneText").textContent = `${note ? note + " " : ""}You scored ${score} points with ${moves.length} words. Your best: ${best}.`;
    } else {
      $("#lpDoneTitle").textContent = cleared ? "Cleared!" : "No more words";
      $("#lpDoneText").textContent = cleared
        ? `You cleared the pile in ${moves.length} words${t} (par ${par})${hints ? ` using ${hints} hint${hints === 1 ? "" : "s"}` : ""}: ${moves.map(m => m.word.toUpperCase()).join(", ")}.`
        : `No word can be made from the ${left} tile${left === 1 ? "" : "s"} left, after ${moves.length} word${moves.length === 1 ? "" : "s"}. Undo a word or two, or restart, to try another route.`;
    }
    say(arcade ? `Final score: ${score}.` : cleared ? `Cleared in ${moves.length} words (par ${par}).` : `${left} tiles left.`);
    if (daily) { record(cleared); showStats(); }
    save();
    status();
  }
  function shareText() {
    const h = hints ? ` · ${hints} hint${hints === 1 ? "" : "s"}` : "";
    const left = LP.count(cols);
    const head = left ? `Letterpile #${puzzle.number} — ${left} tiles left after ${moves.length} word${moves.length === 1 ? "" : "s"} (par ${par})` : `Letterpile #${puzzle.number} — cleared in ${moves.length} words (par ${par})`;
    return `${head}${h}\n${moves.map(m => SQUARE(m.word.length)).join("")}\nletterpile.app/games/letterpile`;
  }

  const blank = () => ({ played: 0, cleared: 0, cur: 0, best: 0, atPar: 0, dist: [0, 0, 0, 0, 0, 0], last: null, lastClear: null });
  function record(cleared) {
    if (date !== G.today()) return;
    const s = Object.assign(blank(), G.load(STATS, {}));
    if (s.last === date) return;
    s.played++; s.last = date;
    if (cleared) {
      s.cleared++;
      s.cur = s.lastClear === G.addDays(date, -1) ? s.cur + 1 : 1;
      s.best = Math.max(s.best, s.cur); s.lastClear = date;
      const over = moves.length - par;
      if (over <= 0) s.atPar++;
      s.dist[Math.min(5, Math.max(0, over))]++;
    } else s.cur = 0;
    G.save(STATS, s);
  }
  function showStats() {
    const s = Object.assign(blank(), G.load(STATS, {}));
    const cur = s.lastClear && s.lastClear >= G.addDays(G.today(), -1) ? s.cur : 0;
    const set = (k, v) => { const el = root.querySelector(`[data-stat="${k}"]`); if (el) el.textContent = v; };
    set("played", s.played); set("cur", cur); set("best", s.best); set("par", s.atPar);
    const top = Math.max(1, ...s.dist);
    s.dist.forEach((n, i) => { const b = root.querySelector(`[data-dist="${i}"]`); if (b) { b.textContent = n; b.style.setProperty("--w", `${Math.max(8, Math.round(100 * n / top))}%`); } });
  }


  function save() {
    if (!daily) return;
    G.save(G.key("letterpile", date), { moves: moves.map(m => ({ w: m.word, p: m.path })), hints, done, won: done ? !LP.count(cols) : undefined, t: timer ? timer.elapsed() : 0 });
  }


  submitBtn.addEventListener("click", play);
  $("#lpClear").addEventListener("click", () => { path = []; hinted = null; draw(); });
  $("#lpUndo")?.addEventListener("click", undo);
  $("#lpRestart")?.addEventListener("click", restart);
  $("#lpHint")?.addEventListener("click", hint);
  $("#lpNew")?.addEventListener("click", () => newBoard());
  const how = $("#lpHow");
  const openHow = () => { if (how.showModal) how.showModal(); else how.setAttribute("open", ""); };
  $("#lpHowBtn").addEventListener("click", openHow);
  $("#lpHowClose").addEventListener("click", () => { how.close ? how.close() : how.removeAttribute("open"); G.save(SEEN, 1); });
  const toggle = $("#lpTimerToggle");
  const settings = G.load(SETTINGS, { timer: false });
  if (toggle) {
    toggle.checked = !!settings.timer;
    toggle.addEventListener("change", () => { G.save(SETTINGS, { timer: toggle.checked }); $("#lpTimer").hidden = !toggle.checked; });
  }
  if (daily) G.shareBar(root.querySelector("[data-share]"), shareText, "/games/letterpile");


  function begin(board, sol, p, saved) {
    start = board; solution = sol || []; par = p || solution.length;
    moves = []; hints = 0; done = false; path = []; hinted = null; score = 0; movesLeft = 8;
    $("#lpDone").hidden = true;
    boardEl.innerHTML = "";
    boardEl.style.setProperty("--n", N);
    if (saved) { moves = saved.moves.map(m => ({ word: m.w, path: m.p })); hints = saved.hints || 0; }
    if (moves.length && !LP.replay(board, moves)) { moves = []; hints = 0; if (saved) saved.done = false; }
    rebuild(); draw();
  }
  let lpWords = null;
  async function newBoard() {
    if (arcade) {
      moves = []; score = 0; movesLeft = 8; done = false; path = [];
      $("#lpDone").hidden = true;
      boardEl.innerHTML = "";
      boardEl.style.setProperty("--n", N);
      cols = Array.from({ length: N }, () => []); ids = cols.map(() => []);
      draw(refill());
      say("Score as much as you can in 8 words.");
      return;
    }
    say("Dealing a new pile…");
    if (!LP.generate) await script(root.dataset.lpgen);
    if (!lpWords) lpWords = await fetch(root.dataset.lpwords).then(r => r.json());
    let g = null;
    const n = 5 + Math.floor(Math.random() * 4);
    for (let t = 0; t < 60 && !g; t++) g = LP.generate(Math.random, lpWords, n, 5);
    begin(g.cols, g.solution, g.solution.length);
    say(`New pile: par ${n}. Clear it in as few words as you can.`);
  }

  async function init() {
    if (!G.load(SEEN, 0)) openHow();
    if (daily) {
      const res = await G.open("letterpile");
      date = res.date;
      if (!res.puzzle) { G.comeBackSoon(root); return; }
      puzzle = res.puzzle;
      const sol = JSON.parse(G.decode(puzzle.s, `letterpile:${date}`));
      const st = G.state("letterpile", date);
      begin(puzzle.board.split("/").map(c => [...c]), sol, puzzle.par, st);
      timer = G.timer($("#lpTimer"), st?.t || 0);
      $("#lpTimer").hidden = !settings.timer;
      draw();
      if (st?.done) { finish(!LP.count(cols)); } else { timer.start(); say("Trace a word through neighboring tiles."); }
    } else {
      G.countdown();
      const d = $("[data-game-date]"); if (d) d.textContent = arcade ? "Arcade: 8 words, highest score wins" : "Practice: unlimited piles";
      await newBoard();
    }
    root.closest("#game").dataset.ready = "1";
    loadWords().then(() => { if (!done && moves.length) check(); }).catch(() => say("Couldn't load the word list. Check your connection and reload."));
  }
  init();
})();
