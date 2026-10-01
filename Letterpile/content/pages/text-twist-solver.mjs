// Text Twist and Wordscapes Solver. Copy reused from the live page and expanded; examples computed.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const wheel = "drange";
  const all = Engine.unscramble(wheel, { min: 3 }).map(x => x.word);
  const full = all.filter(w => w.length === wheel.length);
  const slot = "?a??";
  const re = new RegExp("^" + [...slot].map(c => c === "?" ? "[a-z]" : c).join("") + "$");
  const slotted = Engine.unscramble(wheel, { min: 3, pattern: re }).map(x => x.word);
  const min5 = Engine.unscramble(wheel, { min: 5 }).map(x => x.word);
  return {
    key: "twist", path: "/text-twist-solver", file: "text-twist-solver.html", type: "tool", script: "twist",
    title: "Text Twist and Wordscapes Solver | Letterpile",
    description: "Find every 3+ letter word in your letter wheel, with slot patterns for partly solved answers.",
    h1: "Text Twist and Wordscapes Solver",
    lede: "Enter the letters on your wheel or rack to see every word of three or more letters. Have some squares already? Add a slot pattern like <code>?A??</code>.",
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row">
            <input class="big-input grow" id="letters" type="text" maxlength="10" placeholder="e.g. DRANGE" aria-label="Letters" required>
            <button class="btn" type="submit">Solve</button>
            <button class="btn secondary" type="button" id="twist" title="Shuffle the letters">Twist</button>
          </div>
          <div class="row">
            <label class="field"><span>Slot pattern (optional)</span><input type="text" id="slots" maxlength="10" placeholder="e.g. ?A?? or R????"></label>
            <label class="field narrow"><span>Minimum length</span><select id="min"><option>3</option><option>4</option><option>5</option><option>6</option></select></label>
          </div>
          ${ctx.showAllToggle}
        </form>
        <div class="tiles tiles--wheel" id="wheel"></div>
        <div class="results" id="results" aria-live="polite"><p class="empty">Words from your letters will appear here, longest first.</p></div>`,
    prose: `<p>Letter-wheel games give you a small set of letters, often six or seven, and ask you to find every word hidden in them, usually three letters or longer. This solver lists them all from its word list, longest first, so you can find the word that uses every letter and fill in the shorter ones you're missing. If the game shows the shape of an answer with some letters already filled in, a slot pattern narrows the list to just the words that fit.</p>
<h2>One solver, several games</h2>
<p>Text Twist, Wordscapes, Word Cookies and plenty of newspaper word wheels all ask the same thing: find the words hidden in a small set of letters, usually three letters or longer, without reusing a letter. The rules for minimum length and which words count vary, so the solver lets you set the minimum length.</p>
<!--@slot after-intro-->
<h2>How to use it</h2>
<ol>
<li>Type the letters from the wheel (up to 10).</li>
<li>Optionally add a slot pattern for one answer, using <kbd>?</kbd> for the squares you don't have yet.</li>
<li>Choose a minimum length if your game only counts longer words.</li>
<li>Press <b>Solve</b>. Use <b>Twist</b> to shuffle the letters if you want to keep trying on your own.</li>
</ol>
<h3>Slot patterns</h3>
<p>Wordscapes-style games show the shape of each answer in a crossword grid. If a four-square answer already has an A in the second square, enter <code>?A??</code> and you'll see only the words that fit.</p>
<h3>The Twist button</h3>
<p>Staring at the same letter order is the classic way to get stuck. <b>Twist</b> shuffles your letters, the same trick the games offer, often enough to make a word jump out.</p>
<h2>A worked example</h2>
<ul>
<li>The letters ${code(wheel)} give ${fmt(all.length)} words of three letters or more.</li>
<li>${fmt(full.length)} use all six letters: ${ctx.list(full, full.length)}. In many wheel games, finding one of those completes the round.</li>
<li>With the slot pattern ${code(slot)}, the list narrows to ${fmt(slotted.length)}: ${ctx.list(slotted, Math.min(8, slotted.length))}.</li>
<li>With a minimum length of 5, there are ${fmt(min5.length)}.</li>
</ul>
<h2>Reading the results</h2>
<p>Words are grouped by length, longest first, and alphabetical within each group. The letter tiles above the results show your wheel with each letter's common tile value. Tap a word to look it up.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Including a letter twice.</b> Type each tile from the wheel once, unless the wheel really has two.</li>
<li><b>Wrong slot length.</b> The pattern must have exactly as many characters as the answer's squares.</li>
<li><b>Expecting every listed word to count.</b> Games accept their own set of words; plurals and rare words are the usual differences.</li>
</ul>
<h2>Limits and accuracy</h2>
<p>${ctx.WORDLIST_NOTE} The list is broader than any one game's, so you'll see extra words these games don't accept. Longer, more common words are the safest bets. Letterpile is independent of the games named here.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>The letters you enter are solved in your browser and not sent to Letterpile.</p>`,
    faq: [
      { q: "Which games does it work for?", a: "Any game where you make words from a fixed set of letters without reusing them, such as letter wheels, word cookies and Text Twist-style rounds." },
      { q: "What is a slot pattern?", a: "A pattern for one answer, with known letters in place and ? for unknown squares, like ?A?? for a four-letter word with A second." },
      { q: "Why does it list words my game won't accept?", a: "It uses the open ENABLE word list, which is larger than most games' lists. Prefer common words when you're unsure." },
      { q: "Can I change the minimum word length?", a: "Yes, from 3 to 6 letters, with the Minimum length menu." },
      { q: "What does the Twist button do?", a: "It shuffles the letters in the box, to help you spot words yourself. It doesn't change the results." },
    ],
    related: [
      { href: "/", label: "Word Unscrambler" },
      { href: "/anagram-solver", label: "Anagram Solver" },
      { href: "/crossword-solver", label: "Crossword Solver" },
      { href: "/guides/anagram-basics", label: "What Is an Anagram?" },
    ],
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Look for the longest word first: in Text Twist it's the one that uses every letter.</p></section>`,
  };
};
