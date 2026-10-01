// Word Unscrambler (/). Copy reused from the live page, updated for the ENABLE list.
export default ctx => {
  const ex = ctx.unscramble("eilnst");
  return {
    key: "unscrambler", path: "/", file: "index.html", type: "tool", script: "unscramble",
    title: "Word Unscrambler: Find Words in Your Letters | Letterpile",
    description: "Type your letters and see every word hiding in them, longest first. Handles blank tiles and starts-with, ends-with and length filters.",
    h1: "Word Unscrambler",
    lede: `Type your letters and see every word hiding in them, longest first. Use <kbd>?</kbd> for a blank or unknown letter.`,
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row">
            <input class="big-input grow" id="letters" type="text" maxlength="18" placeholder="Enter letters, e.g. TACRE?" aria-label="Letters (up to 15, plus up to 3 ? blanks)" required>
            <button class="btn" type="submit">Unscramble</button>
          </div>
          <details class="advanced" id="adv">
            <summary>Advanced filters</summary>
            <div class="row">
              <label class="field"><span>Starts with</span><input type="text" id="starts" maxlength="10"></label>
              <label class="field"><span>Ends with</span><input type="text" id="ends" maxlength="10"></label>
              <label class="field"><span>Contains</span><input type="text" id="contains" maxlength="10"></label>
              <label class="field"><span>Length</span><select id="len"><option value="">Any</option></select></label>
            </div>
            <label class="check mt"><input type="checkbox" id="exact"> Use every letter (anagrams only)</label>
          </details>
          ${ctx.showAllToggle}
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Your words will appear here, longest first. Example: the letters <kbd>EILNST</kbd> make ${ctx.fmt(ex.length)} words, including ${ctx.list(ex.filter(w => w.length === 6), 3)}.</p></div>`,
    prose: `<h2>How it works</h2>
        <p>Letterpile checks your letters against the ${ctx.fmt(ctx.total)} words in the open ENABLE word list and keeps every word you could spell without reusing a tile. Results are grouped by length, so the long, high-value words are at the top.</p>
        <h3>Blanks and unknown letters</h3>
        <p>Put a <kbd>?</kbd>, <kbd>*</kbd> or <kbd>_</kbd> in your letters for each blank tile, up to three. Letters filled in by a blank are underlined with dots in the results. You can enter up to 15 letters plus the blanks.</p>
        <h3>Narrowing things down</h3>
        <ul>
          <li><b>Starts with / ends with</b> helps when a word has to hook onto letters already on the board.</li>
          <li><b>Contains</b> finds words that pass through a letter or run of letters, like <code>qu</code> or <code>ing</code>.</li>
          <li><b>Use every letter</b> turns the unscrambler into a strict anagram finder.</li>
        </ul>
        <p>Tap any word for its point value and an optional definition lookup.</p>
        <h2>What people use it for</h2>
        <p>Racks in tile games, the daily jumble, Text Twist rounds, crossword clues where you know the letters but not the order, and settling arguments about whether a word exists. ${ctx.WORDLIST_NOTE}</p>`,
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Stuck on a seven-letter rack? Check the 7-letter group first: many tile games give a bonus for using all your tiles.</p></section>`,
  };
};
