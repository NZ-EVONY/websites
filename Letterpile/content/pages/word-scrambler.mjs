// Word Scrambler. Copy reused from the live page.
export default ctx => ({
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
  prose: `<h2>Scrambling styles</h2>
        <table>
          <tr><th>Style</th><th>Example: “puzzle”</th><th>Good for</th></tr>
          <tr><td>Scramble each word</td><td><code>zpuzle</code></td><td>Word jumbles and worksheets</td></tr>
          <tr><td>Keep first &amp; last letter</td><td><code>pzzule</code></td><td>The “you can still read this” effect</td></tr>
          <tr><td>Mix all letters</td><td>letters cross word boundaries</td><td>Hard mode, or making anagram puzzles</td></tr>
          <tr><td>Shuffle word order</td><td>sentence order changes</td><td>Grammar and sentence-building exercises</td></tr>
          <tr><td>Reverse each word</td><td><code>elzzup</code></td><td>Secret notes and mirror games</td></tr>
        </table>
        <p>Words are always shuffled into a different order when one exists. Punctuation, numbers and capital positions stay where they were. Scrambling happens in your browser; the text is not sent anywhere.</p>
        <h2>Why keeping the ends works</h2>
        <p>Fluent readers take in the outline of a word as much as its letter order, so a word that starts and ends correctly is often readable even when the middle is chaos. It works best on short, familiar words and breaks down fast on long or unusual ones.</p>`,
  sidebar: `<section class="panel tip"><h2>Tip</h2><p>Want printable puzzles? Choose <b>Versions: 10</b>, copy the lot, and paste into your document. Every version is shuffled differently.</p></section>`,
});
