// Daily Word (/games/word): guess the day's five-letter word in six tries. The board, the
// on-screen keyboard and the statistics are filled in by src/assets/games/word.js.
import { shareRow } from "../../../src/templates/partials/game-cards.mjs";
export default ctx => {
  const { fmt } = ctx;
  const keys = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const guessCount = ctx.games.guessCount;
  return {
    key: "game-word", section: "games", path: "/games/word", file: "games/word.html", type: "game", game: "word", games: ["word"], og: "word",
    title: "Daily Word: Guess the Five-Letter Word | Letterpile",
    description: "A free daily word game: guess the five-letter word in six tries. New puzzle every day at midnight UTC, with streaks and a spoiler-free share.",
    h1: "Daily Word",
    crumbs: [{ name: "Home", path: "/" }, { name: "Daily Games", path: "/games" }, { name: "Daily Word", path: "/games/word" }],
    tool: `<div class="word-game" data-guesses="${ctx.assets["games/guesses.json"]}">
          <div class="game-bar"><span class="game-msg" id="wordMsg" role="status" aria-live="polite">Type a five-letter word.</span><button type="button" class="btn secondary small" id="statsBtn" aria-expanded="false" aria-controls="wordStats">Statistics</button></div>
          <div class="dw-board" id="board" aria-label="Your guesses" role="group">${`<div class="dw-row">${'<span class="dw-tile" role="img" aria-label="empty"></span>'.repeat(5)}</div>`.repeat(6)}</div>
          <div class="wkeys" id="keys" aria-label="Keyboard" role="group">
            ${keys.map((row, i) => `<div class="krow">${i === 2 ? '<button type="button" class="key wide" data-key="Enter">Enter</button>' : ""}${[...row].map(k => `<button type="button" class="key" data-key="${k}">${k}</button>`).join("")}${i === 2 ? '<button type="button" class="key wide" data-key="Backspace" aria-label="Delete letter">⌫</button>' : ""}</div>`).join("\n            ")}
          </div>
          <section class="word-stats" id="wordStats" aria-labelledby="statsTitle" hidden>
            <h2 id="statsTitle">Your statistics</h2>
            <dl class="stat-row"><div><dt>Played</dt><dd data-stat="played">0</dd></div><div><dt>Win %</dt><dd data-stat="pct">0</dd></div><div><dt>Current streak</dt><dd data-stat="cur">0</dd></div><div><dt>Best streak</dt><dd data-stat="max">0</dd></div></dl>
            <h3>Guess distribution</h3>
            <ol class="dist" id="dist">${[1, 2, 3, 4, 5, 6].map(n => `<li><span class="n">${n}</span><span class="bar" data-dist="${n}">0</span></li>`).join("")}</ol>
            ${shareRow({ hidden: true })}
          </section>
        </div>`,
    prose: `<h2>How to play</h2>
<p>Guess the hidden five-letter word in six tries. Type a word with your keyboard or the letter buttons and press <b>Enter</b>. Each tile then changes to show how close you were:</p>
<ul>
<li><b>Green with a check mark:</b> the letter is in the word and in that spot.</li>
<li><b>Yellow with a dot:</b> the letter is in the word, but in a different spot.</li>
<li><b>Gray:</b> the letter isn't in the word, or not as many times as you used it.</li>
</ul>
<p>The letter buttons take the same colors, so you can see at a glance which letters are left. Every guess must be a real word: the game accepts ${fmt(guessCount)} five-letter words, but the answers are everyday words, never plurals ending in S and nothing rude.</p>
<h2>Repeated letters</h2>
<p>A word can contain the same letter twice. If you guess a word with two E's and the answer has only one, one E is colored and the other is gray. A gray tile on a repeated letter tells you there are no more copies than the ones already shown.</p>
<h2>Streaks and sharing</h2>
<p>Win on consecutive days to build a streak. Your statistics (games played, win percentage, current and best streak, and how many guesses your wins took) are kept in this browser only. When you finish, <b>Share result</b> copies a grid of colored squares that shows how you did without giving the word away.</p>
<p>Stuck partway? <a href="/games/word/hints">Today's hints</a> give away one clue at a time, and the <a href="/wordle-solver">Wordle Solver</a> lists every word that still fits your clues, and the guide to <a href="/guides/wordle-strategy">five-letter word strategy</a> explains which first guesses test the most common letters.</p>`,
    faq: [
      { q: "When does the word change?", a: "Every day at 00:00 UTC, the same moment for everyone. The countdown above the board shows how long is left." },
      { q: "Can I play yesterday's word?", a: "Yes. The <a href=\"/games\">Daily Games</a> page links to the last seven days. Archive games don't change your streak." },
      { q: "Why was my word rejected?", a: "Guesses must be five-letter words from the word list the game uses. Names, abbreviations and some rude words aren't accepted." },
      { q: "Is my progress saved?", a: "Yes, in this browser's local storage, so a reload or a closed tab doesn't lose your guesses. Another device or browser starts fresh." },
      { q: "Is this the same puzzle as other daily word games?", a: "No. Letterpile's answers are chosen from its own list of everyday words, so the answer is different from other sites' puzzles." },
    ],
    related: [
      { href: "/games/word/hints", label: "Today's hints (spoilers)" },
      { href: "/games", label: "All daily games" },
      { href: "/wordle-solver", label: "Wordle Solver" },
      { href: "/words-by-length/5-letter-words", label: "5-letter words" },
    ],
  };
};
