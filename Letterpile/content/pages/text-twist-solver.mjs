// Text Twist and Wordscapes Solver. Copy reused from the live page.
export default ctx => ({
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
  prose: `<h2>One solver, several games</h2>
        <p>Text Twist, Wordscapes, Word Cookies and plenty of newspaper word wheels all ask the same thing: find the words hidden in a small set of letters, usually three letters or longer, without reusing a letter.</p>
        <h3>Slot patterns</h3>
        <p>Wordscapes shows the shape of each answer in its crossword grid. If a four-square answer already has an A in the second square, enter <code>?A??</code> and you'll see only the words that fit.</p>
        <h3>The Twist button</h3>
        <p>Staring at the same letter order is the classic way to get stuck. <b>Twist</b> shuffles your letters, the same trick the games offer, often enough to make a word jump out.</p>
        <p>${ctx.WORDLIST_NOTE} The list is broader than any one game's, so you'll see extra words these games don't accept. Longer, more common words are the safest bets.</p>`,
  sidebar: `<section class="panel tip"><h2>Tip</h2><p>Look for the longest word first: in Text Twist it's the one that uses every letter.</p></section>`,
});
