// Guide: Wordle strategy. All frequencies come from the five-letter words in the shipped
// list (not the game's answer list), computed at build time.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const five = ctx.clean.filter(w => w.length === 5);
  const present = {}, pos = Array.from({ length: 5 }, () => ({}));
  for (const w of five) {
    for (const c of new Set(w)) present[c] = (present[c] || 0) + 1;
    [...w].forEach((c, i) => { pos[i][c] = (pos[i][c] || 0) + 1; });
  }
  const top = Object.entries(present).sort((a, b) => b[1] - a[1]);
  const pct = n => (100 * n / five.length).toFixed(1);
  const posTop = pos.map(p => Object.entries(p).sort((a, b) => b[1] - a[1]).slice(0, 3));
  const repeats = five.filter(w => new Set(w).size < 5).length;
  // Feedback the way the game gives it (repeated letters handled).
  const feedback = (g, a) => {
    const m = Array(5).fill("b"), left = {};
    for (let i = 0; i < 5; i++) { if (g[i] === a[i]) m[i] = "g"; else left[a[i]] = (left[a[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) if (m[i] !== "g" && left[g[i]] > 0) { m[i] = "y"; left[g[i]]--; }
    return m.join("");
  };
  const remaining = guesses => Engine.wordleCandidates(guesses).length;
  // Worked example with a fixed answer: each guess's colors are computed, not typed.
  const answer = "spore", g1 = "crane", g2 = "spilt";
  ctx.assertWords([answer, g1, g2, "slate", "geese", "speed"]);
  const m1 = feedback(g1, answer), m2 = feedback(g2, answer);
  const after1 = remaining([{ word: g1, marks: m1 }]);
  const after2 = remaining([{ word: g1, marks: m1 }, { word: g2, marks: m2 }]);
  const name = m => [...m].map(c => ({ g: "green", y: "yellow", b: "gray" })[c]).join(", ");
  const dbl = feedback("geese", "speed");
  return {
    key: "guide-wordle", path: "/guides/wordle-strategy", file: "guides/wordle-strategy.html", type: "guide",
    published: "2026-10-01",
    title: "Wordle Strategy and Letter Logic | Letterpile",
    description: "Practical ways to narrow a five-letter puzzle: letter frequency in a real word list, opening patterns and common traps.",
    h1: "Wordle Strategy and Letter Logic",
    prose: `<p class="summary">Daily five-letter puzzles reward a simple habit: use each guess to learn as much as possible, then use what you learned. This guide shows which letters are most common in five-letter words, how the colors work with repeated letters, and a worked example of a puzzle narrowing down. The numbers come from the ${fmt(five.length)} five-letter words in the open ENABLE list that Letterpile uses, not from the game's own answer list, which is smaller and mostly made of everyday words.</p>
<!--@slot after-intro-->
<h2>Which letters are most common</h2>
<p>The table shows the share of five-letter words in the list that contain each letter at least once. It is a useful guide to which letters are worth testing early.</p>
<table>
<tr><th>Letter</th><th>Words containing it</th><th>Share</th></tr>
${top.slice(0, 12).map(([c, n]) => `<tr><td>${c.toUpperCase()}</td><td>${fmt(n)}</td><td>${pct(n)}%</td></tr>`).join("")}
</table>
<p>${top[0][0].toUpperCase()} tops the list because the word list includes many plurals, such as five-letter words made by adding S to a four-letter word. A puzzle that avoids plurals as answers will make S less useful than this table suggests, which is one reason to treat these numbers as a starting point.</p>
<h2>Letters by position</h2>
<p>Where a letter tends to sit matters too. In this list the most common letters in each position are:</p>
<table>
<tr><th>Position</th><th>Most common letters</th></tr>
${posTop.map((t, i) => `<tr><td>${i + 1}</td><td>${t.map(([c, n]) => `${c.toUpperCase()} (${fmt(n)})`).join(", ")}</td></tr>`).join("")}
</table>
<p>A letter that turns yellow tells you it's in the word but not in that spot. Knowing where letters usually sit helps you guess where it belongs.</p>
<h2>Opening guesses</h2>
<p>A good first guess uses five different letters, mostly common ones, so every tile tests something new. Words such as ${code("slate")} and ${code("crane")} fit that description. There is no single best opener: some players prefer to test vowels, others common consonants. What matters more is the second guess, which should use the first guess's colors and still test new letters where possible.</p>
<p>Of the five-letter words in the list, ${fmt(repeats)} have a repeated letter. Repeated-letter words test fewer letters, so they are weaker as early guesses, but don't rule them out as answers.</p>
<!--@slot mid-article-->
<h2>How colors work with repeated letters</h2>
<ul>
<li><b>Green</b>: right letter, right spot.</li>
<li><b>Yellow</b>: the letter is in the word, but somewhere else.</li>
<li><b>Gray</b>: the word has no more copies of that letter than the ones already shown green or yellow.</li>
</ul>
<p>The third rule is the one that trips people up. Suppose the answer were ${code("speed")} and you guessed ${code("geese")}. The colors would be ${name(dbl)}. Two E's are green or yellow because the answer has two E's; the third E is gray even though E is in the word, because there is no third E. A gray tile on a repeated letter limits how many copies there are; it doesn't rule the letter out.</p>
<h2>A worked example</h2>
<p>Say the answer is ${code(answer)} (we pick it here only to compute the colors; the solver never knows the answer).</p>
<ol>
<li>Guess ${code(g1)}. The colors come back: ${name(m1)}. Using those clues, ${fmt(after1)} words in the list still fit.</li>
<li>Guess ${code(g2)}, which keeps the letters we know about in useful places and tests new ones. Colors: ${name(m2)}. Now ${fmt(after2)} ${after2 === 1 ? "word fits" : "words fit"}.</li>
<li>From there, pick the most familiar word among the few that remain. Everyday words are more likely to be answers than obscure ones.</li>
</ol>
<p>You can replay this in the <a href="/wordle-solver">Wordle Solver</a>: add each guess and tap the tiles to match the colors above.</p>
<p>If you want to check a worked example yourself, the <a href="/crossword-solver">Crossword Solver</a> can show every word that fits a pattern of known letters, which is a quick way to see how many candidates a set of green tiles leaves.</p>
<h2>Common traps</h2>
<ul>
<li><b>Repeating known-gray letters.</b> Every letter in a guess should either test something new or confirm a position.</li>
<li><b>Fixing too early.</b> When many words share four letters (for example, a run of words that differ only in the first letter), a guess that tests several of those first letters at once can save turns.</li>
<li><b>Ignoring yellow positions.</b> A yellow letter can't be in the spot where it was yellow. Move it.</li>
</ul>
<h2>About this list and the game</h2>
<p>Wordle™ is a trademark of The New York Times Company; Letterpile is not affiliated with it. The game uses its own word lists, which are not the ENABLE list. The solver on this site can suggest words the game will never use as answers, and it may miss words the game accepts as guesses. ${ctx.WORDLIST_NOTE}</p>`,
    related: [
      { href: "/wordle-solver", label: "Wordle Solver" },
      { href: "/guides/solve-daily-word-puzzles", label: "Solving Daily Word Puzzles" },
      { href: "/words-by-length/5-letter-words", label: "5-letter words" },
      { href: "/crossword-solver", label: "Crossword Solver (pattern search)" },
    ],
  };
};
