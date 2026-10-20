// Hangman Solver. The worked example is computed with the page's own search
// (src/assets/js/wordtools.js).
export default ctx => {
  const { code, fmt, WordTools: T } = ctx;
  const ex = T.hangman("_a__e_", "sto");
  const best = ex.next[0], second = ex.next[1];
  const after = T.hangman(`_a__e${best.letter}`, "sto");
  const five = T.hangman("_____", "");
  const pct = (n, d) => Math.round(100 * n / d);
  return {
    key: "hangman", path: "/hangman-solver", file: "hangman-solver.html", type: "tool", script: "hangman", wordtools: true,
    title: "Hangman Solver: Matching Words and Best Guess | Letterpile",
    description: "Type the hangman pattern and your wrong guesses to list every word that still fits and see which letter to guess next.",
    h1: "Hangman Solver",
    lede: "Type the word as it stands, with an underscore for each blank, and the letters you've already missed.",
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row">
            <label class="field grow2"><span>Pattern</span><input class="big-input" id="pattern" type="text" maxlength="20" placeholder="e.g. _A__E_" required></label>
            <label class="field"><span>Wrong guesses</span><input class="big-input" id="wrong" type="text" maxlength="26" placeholder="e.g. STO"></label>
          </div>
          ${ctx.showAllToggle}
          <div class="row"><button class="btn" type="submit">Find words</button></div>
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Use _ or ? for each blank. Possible words and the best next letters appear here.</p></div>`,
    prose: `<p>In hangman, one player thinks of a word and draws a blank for each letter; the other guesses letters one at a time. A right guess fills in every copy of that letter, and a wrong one adds a stroke to the gallows. This solver takes the word as it stands, plus the letters that have already missed, and lists every word in our list that still fits. It also ranks the letters you haven't tried by how many of those words contain them, which is the simplest good way to choose the next guess.</p>
<h2>How to use it</h2>
<ol>
<li>Type the pattern: known letters in place and an underscore (or a question mark) for each blank. <code>_A__E_</code> is a six-letter word with A second and E fifth.</li>
<li>Type every wrong guess so far, in any order.</li>
<li>Press <b>Find words</b>. You'll see how many words fit, the best letters to try next, and the words themselves, everyday words first.</li>
</ol>
<!--@slot after-intro-->
<h2>A worked example</h2>
<p>Say the board shows ${code("_a__e_")} and you've already missed S, T and O. The solver finds ${fmt(ex.total)} words that fit. The best next guess is ${code(best.letter)}, which appears in ${fmt(best.n)} of them (${pct(best.n, ex.total)}%), with ${code(second.letter)} close behind in ${fmt(second.n)}. If ${code(best.letter)} turns out to be the last letter, the field drops to ${fmt(after.total)} words.</p>
<h2>Why the rules matter to the search</h2>
<p>Two hangman rules do a lot of the work. First, a correct guess reveals every copy of the letter, so a blank can't hold a letter that's already showing. With ${code("_a__e_")}, no blank can be another A or E. Second, a missed letter appears nowhere in the word. The solver applies both, which is why it can cut thousands of words down to a few hundred after two or three guesses.</p>
<h2>Choosing the next letter</h2>
<p>The ranking counts, for each untried letter, how many remaining words contain it at least once. Guessing the top letter gives you the best chance of a hit, and a hit usually splits the remaining words into much smaller groups depending on where the letter lands. At the very start of a five-letter game, with nothing filled in, ${fmt(five.total)} words are possible and the top letters are ${ctx.list(five.next.map(x => x.letter), 3)}.</p>
<p>A cleverer guesser can sometimes do better by picking a letter that splits the words evenly rather than one that's merely common, but the difference is small and the common-letter rule is easy to follow at the table.</p>
<h2>Tips for setting a hard word</h2>
<ul>
<li><b>Short words are harder than long ones.</b> A long word gives away many letters with each hit; a short word with uncommon letters leaves few clues.</li>
<li><b>Avoid the common letters.</b> Words built from J, X, Z, Y and a single vowel resist the usual E-A-R-S-T opening.</li>
<li><b>Repeated letters don't help much.</b> One right guess fills in every copy, so a word with three E's is easier, not harder.</li>
</ul>
<h2>Limits</h2>
<p>The solver uses ENABLE, an open word list for word games, so it knows many rare words. That's useful when you're stuck and less useful when your friend picked an everyday word; the everyday words are listed first for that reason. Names, places and phrases aren't in the list. Up to 400 words are shown, and the count covers all of them.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>The search runs in your browser. The address bar keeps the pattern and misses so you can share the position.</p>`,
    faq: [
      { q: "How do I type a blank?", a: "Use an underscore or a question mark for each unknown letter. Spaces are ignored, so “_ A _ _ E _” works too." },
      { q: "How is the best next letter chosen?", a: "For each letter you haven't tried, the solver counts how many remaining words contain it. The letter in the most words is listed first." },
      { q: "Why can't a blank be a letter that's already showing?", a: "In hangman a correct guess reveals every copy of the letter, so any other copy would already be on the board." },
      { q: "Does it work for phrases?", a: "Not as a whole. Solve one word at a time, using the same wrong guesses for each word." },
      { q: "It says no words fit. What now?", a: "Check the pattern length and the wrong letters. The word may also be a name, a phrase or a word not in the ENABLE list." },
    ],
    related: [
      { href: "/crossword-solver", label: "Crossword Solver" },
      { href: "/wordle-solver", label: "Five-Letter Solver" },
      { href: "/cryptogram-solver", label: "Cryptogram Solver" },
      { href: "/words-by-length", label: "Words by length" },
    ],
  };
};
