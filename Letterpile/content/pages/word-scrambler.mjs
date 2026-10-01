// Word Scrambler. Copy reused from the live page and expanded.
export default ctx => {
  const { code, fmt } = ctx;
  const levels = [[4, 5, "Easy"], [6, 7, "Medium"], [8, 10, "Hard"]].map(([a, b, n]) => [n, a, b, ctx.clean.filter(w => w.length >= a && w.length <= b && !/(s|ed|ing)$/.test(w)).length]);
  return {
    key: "scrambler", path: "/word-scrambler", file: "word-scrambler.html", type: "tool", script: "scrambler",
    title: "Word Scrambler: Jumble Words and Sentences | Letterpile",
    description: "Scramble words, sentences or whole paragraphs, keep the first and last letters, or play a quick unscramble challenge.",
    h1: "Word Scrambler",
    lede: "Mix up the letters in a word, a sentence or a whole passage. Handy for making puzzles, classroom worksheets and party games.",
    tool: `<form class="tool-form" id="form">
          <label class="field"><span>Your text</span><textarea id="text" maxlength="5000" placeholder="Type or paste words to scramble" required>Letters are more fun when they are out of order</textarea></label>
          <div class="row end">
            <label class="field"><span>Style</span>
              <select id="mode">
                <option value="words">Scramble each word</option>
                <option value="ends">Keep first &amp; last letter</option>
                <option value="all">Mix all letters in the text</option>
                <option value="order">Shuffle word order</option>
                <option value="reverse">Reverse each word</option>
              </select>
            </label>
            <label class="field narrow"><span>Versions</span><select id="count"><option>1</option><option>3</option><option>5</option><option>10</option></select></label>
            <button class="btn" type="submit">Scramble</button>
            <button class="btn secondary" type="button" id="copy">Copy</button>
          </div>
        </form>
        <div class="results results--short" id="results" aria-live="polite"><p class="empty">Your scrambled text will appear here.</p></div>

        <section class="challenge" id="challenge" aria-labelledby="challengeTitle">
          <h2 id="challengeTitle">Unscramble challenge</h2>
          <p class="hint">We scramble a word, you work it out. Any word in the list that uses every tile counts.</p>
          <div class="row center spaced">
            <label class="toolbar flat">Difficulty
              <select id="level"><option value="4-5">Easy (4–5)</option><option value="6-7" selected>Medium (6–7)</option><option value="8-10">Hard (8–10)</option></select></label>
            <span class="hint push" id="streak">Solved: 0 · Streak: 0</span>
          </div>
          <div class="tiles tiles--puzzle" id="puzzle" aria-live="polite"><p class="hint">The puzzle loads when you reach this section.</p></div>
          <form class="row mt" id="guessForm" autocomplete="off">
            <input class="big-input grow" id="guess" type="text" maxlength="40" placeholder="Your answer" aria-label="Your answer">
            <button class="btn" type="submit">Check</button>
            <button class="btn secondary" type="button" id="hint">Hint</button>
            <button class="btn secondary" type="button" id="reshuffle">Shuffle</button>
            <button class="btn secondary" type="button" id="skip">New word</button>
          </form>
          <p id="feedback" class="hint feedback" aria-live="polite"></p>
        </section>`,
    prose: `<p>The scrambler works the other way round from the rest of the site: instead of finding words in jumbled letters, it jumbles your words. Paste any text, choose a style, and it produces up to ten different scrambled versions at once, keeping punctuation and capitals where they were. Teachers use it for spelling and reading exercises, puzzle makers for jumbles, and anyone can use the built-in challenge to practice unscrambling. Scrambling uses a secure random shuffle in your browser, and the text never leaves your device.</p>
<h2>Scrambling styles</h2>
<table>
<tr><th>Style</th><th>Example: “puzzle”</th><th>Good for</th></tr>
<tr><td>Scramble each word</td><td><code>zpuzle</code></td><td>Word jumbles and worksheets</td></tr>
<tr><td>Keep first &amp; last letter</td><td><code>pzzule</code></td><td>The “you can still read this” effect</td></tr>
<tr><td>Mix all letters</td><td>letters cross word boundaries</td><td>Hard mode, or making anagram puzzles</td></tr>
<tr><td>Shuffle word order</td><td>sentence order changes</td><td>Grammar and sentence-building exercises</td></tr>
<tr><td>Reverse each word</td><td><code>elzzup</code></td><td>Secret notes and mirror games</td></tr>
</table>
<p>Words are always shuffled into a different order when one exists. Punctuation, numbers and capital positions stay where they were. Words of one repeated letter, and words of three letters or fewer in “keep first &amp; last” mode, can't change and are left as they are. The example column shows one possible result; yours will differ every time.</p>
<!--@slot after-intro-->
<h2>How to use it</h2>
<ol>
<li>Type or paste your text (up to 5,000 characters).</li>
<li>Choose a <b>Style</b> and how many <b>Versions</b> you want.</li>
<li>Press <b>Scramble</b>. Press it again for new versions.</li>
<li>Press <b>Copy</b> to copy every version, one per line, ready to paste into a document.</li>
</ol>
<h2>Why keeping the ends works</h2>
<p>Fluent readers take in the outline of a word as much as its letter order, so a word that starts and ends correctly is often readable even when the middle is chaos. It works best on short, familiar words and breaks down fast on long or unusual ones. Try it on a sentence of your own with the “Keep first &amp; last letter” style.</p>
<h2>The unscramble challenge</h2>
<p>Below the scrambler is a small game. It picks a word from the list, scrambles it, and asks you to find a word that uses every tile. Any word in the list with exactly those letters counts, not just the one it picked. <b>Hint</b> fixes the next letter of the intended word in place (and resets your streak), <b>Shuffle</b> rearranges the unfixed tiles, and <b>New word</b> reveals the answer and moves on.</p>
<table>
<tr><th>Level</th><th>Word lengths</th><th>Words it can pick from</th></tr>
${levels.map(([n, a, b, c]) => `<tr><td>${n}</td><td>${a}–${b} letters</td><td>${fmt(c)}</td></tr>`).join("")}
</table>
<p>To keep puzzles fair, the challenge skips words ending in S, ED or ING, and never picks a word from the hidden list.</p>
<h2>Ideas for teachers and puzzle makers</h2>
<ul>
<li>Make a spelling worksheet: paste a word list, choose “Scramble each word” and 10 versions, and give each group a different version.</li>
<li>Build a sentence-order activity with “Shuffle word order”.</li>
<li>Make a harder anagram puzzle with “Mix all letters” on a short phrase, then check that a solution exists with the <a href="/anagram-solver">Anagram Solver</a>.</li>
</ul>
<h2>Limits</h2>
<p>Only the letters A to Z are scrambled; accented letters and other alphabets are left as they are. The scrambler doesn't check that the result isn't accidentally another word. The challenge's answers come from the open ENABLE word list, so it accepts some uncommon words.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>Your text is scrambled in your browser and is never sent to Letterpile. It isn't saved, and it isn't added to the page address.</p>`,
    faq: [
      { q: "Can I scramble a whole paragraph?", a: "Yes, up to 5,000 characters. Each word is scrambled separately unless you choose “Mix all letters in the text”." },
      { q: "Will the scrambled word always be different?", a: "Yes, whenever a different order exists. A word with only one distinct letter, or a very short word in “keep first & last” mode, can't change." },
      { q: "Are punctuation and capitals kept?", a: "Yes. Punctuation, numbers and spaces stay where they were, and capital letters keep their positions." },
      { q: "How does the challenge pick words?", a: "It picks a random word of the chosen length from the visible ENABLE list, skipping words ending in S, ED or ING." },
      { q: "Is my text saved?", a: "No. It stays in your browser and disappears when you leave the page." },
    ],
    related: [
      { href: "/", label: "Word Unscrambler" },
      { href: "/jumble-solver", label: "Jumble Solver" },
      { href: "/anagram-solver", label: "Anagram Solver" },
      { href: "/guides/anagram-basics", label: "What Is an Anagram?" },
    ],
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Want printable puzzles? Choose <b>Versions: 10</b>, copy the lot, and paste into your document. Every version is shuffled differently.</p></section>`,
  };
};
