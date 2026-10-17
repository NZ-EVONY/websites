// Daily Word hints (/games/word/hints): graduated hints for today's word, each behind its own
// spoiler button, then the answer. Filled in by src/assets/games/hints.js from today's puzzle,
// so nothing is in the page before the day starts.
export default () => ({
  key: "game-word-hints", section: "games", path: "/games/word/hints", file: "games/word/hints.html", type: "game", game: "word", games: ["hints"], og: "word",
  title: "Daily Word Hints: Clues for Today's Word | Letterpile",
  description: "Stuck on today's Daily Word? Reveal one hint at a time, from the vowel count to the first and last letters, before you decide to see the answer.",
  h1: "Daily Word Hints",
  crumbs: [{ name: "Home", path: "/" }, { name: "Daily Games", path: "/games" }, { name: "Daily Word", path: "/games/word" }, { name: "Hints", path: "/games/word/hints" }],
  tool: `<div class="hints-game">
          <p class="spoiler-warning"><b>Spoiler warning:</b> each button below gives away a little more about today's word. Open only as many as you need.</p>
          <ol class="hint-list" id="hintList"><li class="hint">Loading today's hints…</li></ol>
          <p><a class="btn secondary small" href="/games/word">Back to the Daily Word</a></p>
        </div>`,
  prose: `<h2>How these hints work</h2>
<p>The hints follow the order a good solver would use. The first ones only narrow things down, like how many vowels the word has or whether a letter repeats. Later hints give away a letter in a fixed position, and the last button shows the answer itself. Nothing is revealed until you press its button, and nothing you open is saved or shared.</p>
<p>The hints change with the puzzle, at 00:00 UTC. If you'd rather work it out with logic, the <a href="/wordle-solver">Wordle Solver</a> lists every word that still fits the colors you've seen so far, without knowing the answer, and the guide to <a href="/guides/solve-daily-word-puzzles">solving daily word puzzles</a> explains how to turn each row of colors into rules.</p>`,
  faq: [
    { q: "Will a hint spoil the game?", a: "Only the hints you open. Each one is hidden behind its own button, and the answer is the last button on the page." },
    { q: "When do the hints change?", a: "At 00:00 UTC, when the Daily Word changes. The countdown above shows how long is left." },
    { q: "Do hints count against my streak?", a: "No. The game doesn't know you looked, so your statistics are unchanged." },
  ],
  related: [
    { href: "/games/word", label: "Daily Word" },
    { href: "/wordle-solver", label: "Wordle Solver" },
    { href: "/games", label: "All daily games" },
  ],
});
