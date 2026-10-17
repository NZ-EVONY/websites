// Guide: Letterpile (the game) rules and strategy. The worked example's moves are replayed with
// the game's own engine at build time, so the board shown after each move is computed.
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const LP = require("../../../src/assets/games/lp-gen.js");

export default ctx => {
  const { code, fmt } = ctx;
  // A small 3x3 example pile (columns listed bottom to top). The facts stated in the text are
  // checked here, so the build fails if they stop being true.
  const start = [["b", "u", "t"], ["g", "o", "h"], ["e", "y", "n"]];
  ctx.assertWords(["hog", "buy", "ten"]);
  const trace = (b, w) => LP.findPath(b, w);
  const fallen = LP.drop(start, trace(start, "hog"));       // gravity only: the middle column is empty
  const after1 = LP.remove(start, trace(start, "hog"));     // then the right column slides left
  const after2 = LP.remove(after1, trace(after1, "buy"));
  const after3 = LP.remove(after2, trace(after2, "ten"));
  if (trace(start, "buy") || trace(start, "ten") || fallen[1].length || trace(fallen, "buy") || !trace(after1, "buy") || trace(after1, "ten") || !trace(after2, "ten") || LP.count(after3))
    throw new Error("guides/letterpile: the worked example no longer behaves as described");
  const show = cols => {
    const h = Math.max(...cols.map(c => c.length));
    let rows = "";
    for (let r = h - 1; r >= 0; r--) rows += `<tr>${cols.map(c => `<td>${c[r] ? c[r].toUpperCase() : "·"}</td>`).join("")}</tr>`;
    return `<table class="lp-example">${rows}</table>`;
  };
  const three = fmt(ctx.byLength[3]);
  return {
    key: "guide-letterpile", path: "/guides/letterpile", file: "guides/letterpile.html", type: "guide",
    published: "2026-10-17",
    title: "Letterpile Guide: Rules, Strategy and Tips | Letterpile",
    description: "How to play Letterpile, our daily pile-of-letters puzzle: the rules, how falling tiles change the board, and strategy for clearing the pile in fewer words.",
    h1: "Letterpile: Rules and Strategy",
    prose: `<p><a href="/games/letterpile">Letterpile</a> is the daily word puzzle we made for this site. It looks like a word search at first, but it plays more like a game of falling blocks: every word you take out of the pile changes the shape of what's left. This guide explains the rules, works through a small example, and collects the strategy that helps most when you're trying to match or beat par.</p>
<h2>The rules</h2>
<ul>
<li>The pile is a 5×5 grid of letter tiles. Each tile shows its letter and a point value.</li>
<li>Trace a word through tiles that touch, side to side, up and down or diagonally. Each tile can be used once per word. Words need at least three letters and must be in the word list (ENABLE, without a short list of rude words).</li>
<li>When you play a word, its tiles are removed. Tiles above a gap fall straight down within their column. No new tiles are added in the daily game.</li>
<li>If a whole column empties, it closes up: the columns to its right slide left, so the pile never splits into islands with empty columns between them.</li>
<li>Clear the whole pile in as few words as possible. A letter that can't be part of any word any more is dimmed. When no word can be made from the tiles left, the game ends by itself and the leftover tiles count against you.</li>
<li>Undo and restart are unlimited, and you get up to three hints a day. The timer is optional.</li>
</ul>
<!--@slot after-intro-->
<h2>A worked example</h2>
<p>Here is a small pile, three tiles wide and three high, shown top row first:</p>
${show(start)}
<p>At the start, ${code("buy")} and ${code("ten")} can't be traced: the letters are there, but the left and right columns don't touch. ${code("hog")} can, straight up the middle column. Play it, and the middle column is empty:</p>
${show(fallen)}
<p>An empty column closes up, so the right-hand column slides left to sit beside the first one:</p>
${show(after1)}
<p>Now the U and the Y are neighbors, and ${code("buy")} fits, starting from the B in the bottom corner. Play that, and the T falls to the bottom row, next to the E:</p>
${show(after2)}
<p>The last three tiles spell ${code("ten")}, and the pile is clear in three words. Play ${code("buy")} or ${code("ten")} too early and they simply aren't there; play the words in a different order and the letters you need can end up apart. Every word changes which letters are neighbors, so thinking a move or two ahead is the heart of the game.</p>
<h2>Strategy</h2>
<h3>Start at the bottom</h3>
<p>Letters in the bottom row have nowhere to fall. If an awkward letter like Q, V, X or J is down there, it can only leave the pile as part of a word you trace through it, and as the pile thins it may lose the neighbors it needs. Plan early for the hardest letters, especially low ones.</p>
<h3>Empty a column on purpose</h3>
<p>Because empty columns close up, clearing a whole column brings two groups of letters together that couldn't meet before. If the letters you need are split between columns that don't touch, look for a word that runs straight up the column between them, as in the example above.</p>
<h3>Long words aren't always better</h3>
<p>A seven-letter word clears more than a quarter of the pile, but if it leaves a cluster of consonants behind, you may need three short words to tidy up. Before you play a long word, look at what falls into the gaps. Sometimes a short word that drops a vowel into a crowded column is the better move.</p>
<h3>Keep vowels spread out</h3>
<p>Most words need a vowel every two or three letters. If every vowel ends up in one column, the other columns become islands of consonants. Words that take a vowel from a column rich in them, and leave the lonelier vowels where they are, keep your options open.</p>
<h3>Count the tiles</h3>
<p>Par tells you the average word length you need. On a par-5 day, the 25 tiles go in five words, so you need about five letters a word. On a par-8 day the words are shorter, and the challenge is finding an order where every short word still fits. The word list has ${three} three-letter words, which is why short words are so often the way out of a tight spot.</p>
<h3>Use the undo button</h3>
<p>Undo is free. Try a word, look at the pile it leaves, and take it back if the result looks stuck. Many players find their best solution by playing the first few words two or three different ways.</p>
<h2>Hints</h2>
<p>Each hint lights up the first tile of a word from a known solution that still fits the board in front of you. You get three a day. Hints are shown in your result, so if you're comparing scores with friends, a solution without hints counts for a little more. If you've gone a long way from the known solution, no hint may fit; undoing a word or two usually brings one back.</p>
<h2>How the piles are made</h2>
<p>Every daily pile is built backwards. We start with an empty grid and add common words one at a time along paths of touching cells, pushing the tiles already there upward, the opposite of falling, and now and then slotting a new column in between two others, the opposite of a column closing up. Played in reverse order, those words clear the pile exactly, so every pile can be cleared. Par is the fewest words we know works: the words the pile was built from, unless a search using common words finds a shorter route. Piles get a little harder through the week, from par 5 early in the week to par 8 on Saturdays.</p>
<h2>Practice and Arcade</h2>
<p><a href="/games/letterpile/practice">Practice</a> deals unlimited new piles from the same generator, with par shown, and saves nothing. <a href="/games/letterpile/arcade">Arcade</a> is different: a 6×6 pile, eight words, and points that grow quickly with word length. In Arcade, cleared tiles are replaced by new letters falling from the top, so it rewards spotting long words rather than clearing the pile.</p>`,
    faq: [
      { q: "Can a word turn corners?", a: "Yes. A word can change direction at every letter, as long as each tile touches the one before it, including diagonally." },
      { q: "Can I use the same tile twice in one word?", a: "No. Each tile can be used once per word. After the word is played, the tile is gone." },
      { q: "Is the daily pile always clearable?", a: "Yes. It's built backwards from real words, so at least one way to clear it exists." },
      { q: "Why did my game end with tiles left?", a: "No word of three or more letters could be traced through the tiles that remained, so the game ended by itself. Undo a few words and try a different order." },
      { q: "Why are some tiles dimmed?", a: "No word in the list can be spelled from the tiles left using that letter, wherever the tiles end up, so those tiles can't be cleared any more. They count as leftovers at the end." },
      { q: "Do plurals and verb forms count?", a: "Yes, if they are in the ENABLE word list, which includes most plurals and verb endings." },
    ],
    related: [
      { href: "/games/letterpile", label: "Play today's Letterpile" },
      { href: "/games/letterpile/practice", label: "Letterpile Practice" },
      { href: "/guides/rack-balance", label: "Rack Balance: Vowels and Consonants" },
    ],
  };
};
