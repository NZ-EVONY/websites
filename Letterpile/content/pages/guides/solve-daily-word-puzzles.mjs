// Guide: a logical method for daily word puzzles. The worked example is computed with the
// same engine the Wordle Solver uses.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const feedback = (g, a) => {
    const m = Array(5).fill("b"), left = {};
    for (let i = 0; i < 5; i++) { if (g[i] === a[i]) m[i] = "g"; else left[a[i]] = (left[a[i]] || 0) + 1; }
    for (let i = 0; i < 5; i++) if (m[i] !== "g" && left[g[i]] > 0) { m[i] = "y"; left[g[i]]--; }
    return m.join("");
  };
  const answer = "bloat";
  const guesses = ["stare", "point", "bloat"];
  ctx.assertWords([answer, ...guesses, "found", "mound", "pound", "round", "sound", "wound", "bound", "hound"]);
  const rows = [];
  const so = [];
  for (const g of guesses) {
    so.push({ word: g, marks: feedback(g, answer) });
    rows.push({ g, marks: so.at(-1).marks, left: Engine.wordleCandidates(so).map(x => x.word) });
  }
  const name = m => [...m].map(c => ({ g: "green", y: "yellow", b: "gray" })[c]).join(", ");
  const five = ctx.clean.filter(w => w.length === 5).length;
  const ound = Engine.patternSearch("?ound").filter(w => ctx.cleanSet.has(w));
  return {
    key: "guide-daily", path: "/guides/solve-daily-word-puzzles", file: "guides/solve-daily-word-puzzles.html", type: "guide",
    published: "2026-10-01",
    title: "How to Solve Daily Word Puzzles Logically | Letterpile",
    description: "A step-by-step method for daily word puzzles: use constraints, track eliminated letters and avoid wasted guesses.",
    h1: "Solving Daily Word Puzzles",
    prose: `<p class="summary">Daily word puzzles where you guess a hidden word and get colored feedback reward method more than luck. The idea is to treat each guess as an experiment: decide what you want to learn, read the feedback carefully, and keep a clear record of what's ruled in and out. This guide describes a step-by-step method, works through an example with real numbers from Letterpile's list, and covers when to guess for the answer and when to probe.</p>
<!--@slot after-intro-->
<h2>Step 1: Know your search space</h2>
<p>Before the first guess, every five-letter word is possible. In the word list this site uses that is ${fmt(five)} words, though a daily puzzle's answer list is much smaller and mostly made of familiar words. Each guess should cut that space down as much as possible.</p>
<h2>Step 2: Turn feedback into rules</h2>
<p>Every colored tile is a rule. Write the rules down, or keep them in your head as three lists:</p>
<ul>
<li><b>Placed</b>: letters that are green, with their positions.</li>
<li><b>Present, not here</b>: yellow letters, with the positions where they can't be.</li>
<li><b>Ruled out</b>: gray letters (but see the note on repeated letters below).</li>
</ul>
<p>Position and presence are different kinds of information. A green tells you exactly where; a yellow tells you the letter exists and removes one position. Two yellows for the same letter in different guesses remove two positions, which can pin it down without ever seeing green.</p>
<h2>Step 3: Repeated letters</h2>
<p>Gray doesn't always mean “not in the word”. If you guess a word with two copies of a letter and the answer has one, one copy will be colored and the other gray. The gray copy only tells you there isn't a second one. The <a href="/guides/wordle-strategy">Wordle strategy guide</a> has a worked example.</p>
<!--@slot mid-article-->
<h2>Step 4: Probe or go for it?</h2>
<p>Once few words remain, you have a choice. You can guess one of the remaining words, which might win immediately, or play a <em>probe</em>: a word chosen to test several of the remaining possibilities at once, even if it can't be the answer.</p>
<p>Probing pays off when many candidates differ in only one position. For example, ${ctx.list(ound, Math.min(8, ound.length))} all fit the pattern ${code("?ound")}. Guessing them one by one could take many turns; a single probe word containing several of the possible first letters can rule most of them out at once. When only two or three candidates remain, guessing one of them is usually better, because a probe can't win.</p>
<h2>A worked example</h2>
<p>Here is a puzzle traced with the same engine as the <a href="/wordle-solver">Wordle Solver</a>. We fix the answer as ${code(answer)} only so the colors can be computed.</p>
<table>
<tr><th>Guess</th><th>Feedback</th><th>Words still possible</th></tr>
${rows.map(r => `<tr><td>${code(r.g)}</td><td>${name(r.marks)}</td><td>${fmt(r.left.length)}</td></tr>`).join("")}
</table>
<ol>
<li>${code(guesses[0])} tests five common letters. The feedback leaves ${fmt(rows[0].left.length)} words.</li>
<li>${code(guesses[1])} avoids the letters already ruled out, tests new ones and tries a known letter in a new position. That leaves ${fmt(rows[1].left.length)}${rows[1].left.length <= 12 ? `: ${ctx.list(rows[1].left, rows[1].left.length)}` : ""}.</li>
<li>${rows[1].left.length <= 3 ? "With so few left, guessing the most familiar one is the best move." : "Choosing the most familiar remaining word is a reasonable next guess."} ${code(guesses[2])} is the answer.</li>
</ol>
<h2>Step 5: Keep an eliminated-letter list</h2>
<p>Most wasted guesses come from reusing a letter that's already ruled out. Before each guess, check every letter against your gray list. Also make sure every yellow letter is in your guess, but not in a position where it was already yellow.</p>
<h2>Hard mode</h2>
<p>Some daily puzzles offer a hard mode in which any revealed hints must be used in later guesses. That rules out pure probe words, so the advice above changes: each guess has to be a possible answer, and the choice is between candidates rather than between a candidate and a probe. Choose the candidate whose untested letters are most common among the remaining words, which is what the Wordle Solver's suggestions rank by.</p>
<h2>Keep a short log</h2>
<p>If you play every day, writing down how many words were possible after each guess (the solver shows this) is a simple way to see which opening habits work for you. Over a few weeks the numbers say more than any single lucky win.</p>
<h2>Using a solver without spoiling the fun</h2>
<p>A solver can apply the rules for you and list what's left. Some people use one only after they've finished, to see how many words were possible at each step; others use it when they're stuck. Letterpile's solver never knows the day's answer, so it can't spoil it. Its list is a general word list, not the puzzle's own, so check its suggestions against what feels like a likely answer. ${ctx.WORDLIST_NOTE}</p>`,
    related: [
      { href: "/wordle-solver", label: "Wordle Solver" },
      { href: "/guides/wordle-strategy", label: "Wordle Strategy and Letter Logic" },
      { href: "/crossword-solver", label: "Crossword Solver" },
      { href: "/words-by-length/5-letter-words", label: "5-letter words" },
    ],
  };
};
