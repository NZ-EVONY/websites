/* Word Scrambler page. Extracted from the live word-scrambler.html inline script.
   Change: the unscramble challenge loads the word list when it scrolls into view
   (or on first use) instead of on page load. */
(function () {
  "use strict";
  const { $, esc, toast, compute } = UI;

  $("#form").addEventListener("submit", e => {
    e.preventDefault();
    const text = $("#text").value, mode = $("#mode").value, n = +$("#count").value;
    const outs = Array.from({ length: n }, () => Engine.scrambleText(text, mode));
    $("#results").innerHTML = outs.map((o, i) =>
      `<div class="scrambled">${n > 1 ? `<span class="hint">#${i + 1}</span> ` : ""}<span class="out">${esc(o)}</span></div>`).join("");
  });
  $("#copy").addEventListener("click", async () => {
    const text = [...document.querySelectorAll("#results .out")].map(p => p.textContent).join("\n");
    if (!text) return toast("Scramble something first");
    try { await navigator.clipboard.writeText(text); toast("Copied"); } catch { toast("Couldn't copy"); }
  });
  $("#form").requestSubmit();

  // ---- challenge ----
  let answer = "", shown = "", revealed = 0, solved = 0, streak = 0;
  const drawTiles = () => {
    $("#puzzle").innerHTML = [...shown].map((ch, i) => `<span${i < revealed ? ' class="revealed"' : ""}>${ch}<sub>${Engine.SCHEMES.scrabble.values[ch]}</sub></span>`).join("");
  };
  const setStreak = () => { $("#streak").textContent = `Solved: ${solved} · Streak: ${streak}`; };
  async function newPuzzle() {
    const [min, max] = $("#level").value.split("-").map(Number);
    answer = await compute("randomWord", { min, max });
    shown = Engine.scrambleWord(answer);
    revealed = 0;
    $("#feedback").textContent = "";
    $("#guess").value = "";
    drawTiles();
  }
  const sameLetters = (a, b) => [...a].sort().join("") === [...b].sort().join("");
  $("#guessForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (!answer) return;
    const g = $("#guess").value.toLowerCase().replace(/[^a-z]/g, "");
    if (!g) return;
    if (sameLetters(g, answer) && await compute("isWord", g)) {
      solved++; streak++;
      $("#feedback").innerHTML = `<b class="good">Correct!</b> ${g === answer ? "" : `(We were thinking of <b>${answer.toUpperCase()}</b>, but yours counts.)`} Next one coming up…`;
      setStreak();
      setTimeout(newPuzzle, 1400);
    } else {
      $("#feedback").textContent = sameLetters(g, answer) ? "Right letters, but that's not in the word list." : "Not quite. Use every tile exactly once.";
    }
  });
  $("#hint").addEventListener("click", () => {
    if (!answer || revealed >= answer.length - 1) return;
    revealed++;
    // Rebuild so the first `revealed` tiles spell the start of the answer.
    const rest = [...answer.slice(revealed)];
    shown = answer.slice(0, revealed) + Engine.shuffle(rest).join("");
    streak = 0;
    setStreak();
    drawTiles();
  });
  $("#reshuffle").addEventListener("click", () => {
    if (!answer) return;
    shown = answer.slice(0, revealed) + Engine.shuffle([...shown.slice(revealed)]).join("");
    drawTiles();
  });
  $("#skip").addEventListener("click", () => {
    if (answer) $("#feedback").innerHTML = `The word was <b>${answer.toUpperCase()}</b>.`;
    streak = 0;
    setStreak();
    setTimeout(newPuzzle, answer ? 1200 : 0);
  });
  $("#level").addEventListener("change", () => { if (started) newPuzzle(); });

  let started = false;
  function start() {
    if (started) return;
    started = true;
    $("#puzzle").innerHTML = `<p class="loading">Loading words…</p>`;
    newPuzzle().catch(e => { $("#puzzle").innerHTML = `<p class="error">${esc(e.message)}</p>`; });
  }
  const box = $("#challenge");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: "200px" });
    io.observe(box);
  }
  ["pointerdown", "keydown", "focusin"].forEach(t => box.addEventListener(t, start, { once: true }));
})();
