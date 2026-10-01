// Word Unscrambler (/). Copy reused from the live page, expanded; examples computed by the engine.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const ex = ctx.unscramble("eilnst");
  const exSix = ex.filter(w => w.length === 6);
  const blank = Engine.unscramble("tacre?");
  const blankNeed = blank.filter(x => x.blanks && x.word.length === 6).map(x => x.word);
  const exact = Engine.unscramble("tacre", { exact: true }).map(x => x.word);
  const startsT = Engine.unscramble("eilnst", { startsWith: "t" }).map(x => x.word);
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
        <div class="results" id="results" aria-live="polite"><p class="empty">Your words will appear here, longest first. Example: the letters <kbd>EILNST</kbd> make ${fmt(ex.length)} words, including ${ctx.list(exSix, 3)}.</p></div>`,
    prose: `<p>A word unscrambler answers one question: which words can I spell with these letters? Type up to 15 letters, add a <kbd>?</kbd> for each blank tile, and Letterpile lists every word from its word list that your letters can make, grouped by length with the longest first. It's handy for tile games, word wheels, jumbles and crossword clues where you know the letters but not the order. Everything runs in your browser, so results appear as soon as the word list has loaded.</p>
<h2>How it works</h2>
<p>Letterpile checks your letters against the ${fmt(ctx.total)} words in the open ENABLE word list and keeps every word you could spell without reusing a tile. It doesn't try every arrangement of your letters; it counts them, then checks each word against the counts, which is much faster. The guide <a href="/guides/how-word-unscramblers-work">How Word Unscramblers Work</a> explains the method step by step.</p>
<!--@slot after-intro-->
<h2>How to use it</h2>
<ol>
<li>Type your letters in the box. Upper or lower case doesn't matter, and anything that isn't a letter is ignored.</li>
<li>Add <kbd>?</kbd>, <kbd>*</kbd> or <kbd>_</kbd> for each blank tile or unknown letter, up to three.</li>
<li>Press <b>Unscramble</b>, or Enter.</li>
<li>Optionally open <b>Advanced filters</b> to narrow the list, then press Unscramble again.</li>
<li>Tap any word to see its point value and, if you want, look up a definition.</li>
</ol>
<h3>Blanks and unknown letters</h3>
<p>Letters filled in by a blank are underlined with dots in the results, so you can tell which tile would have to be the blank. The tool always uses your real letters first and spends a blank only on what's missing.</p>
<h3>Narrowing things down</h3>
<ul>
<li><b>Starts with / ends with</b> helps when a word has to hook onto letters already on the board.</li>
<li><b>Contains</b> finds words that pass through a letter or run of letters, like <code>qu</code> or <code>ing</code>.</li>
<li><b>Length</b> shows only words of one length, useful for crossword squares.</li>
<li><b>Use every letter</b> turns the unscrambler into a strict anagram finder.</li>
</ul>
<h2>Reading the results</h2>
<p>Results are grouped by length, longest first, with a count next to each group. Within a group, words are in alphabetical order. Very large groups show the first 200 words and tell you how many more there are; add a filter to see the rest. The page address updates with your letters, so you can bookmark or share a search.</p>
<h2>Worked examples</h2>
<ul>
<li>The letters ${code("eilnst")} make ${fmt(ex.length)} words of two letters or more. The six-letter ones, which use every letter, are ${ctx.list(exSix, exSix.length)}.</li>
<li>Turning on <b>Use every letter</b> with ${code("tacre")} gives ${fmt(exact.length)} words: ${ctx.list(exact, exact.length)}.</li>
<li>Adding a blank, ${code("tacre?")}, gives ${fmt(blank.length)} words, and ${fmt(blankNeed.length)} six-letter words that need the blank, such as ${ctx.list(blankNeed, 3)}.</li>
<li>Back to ${code("eilnst")} with <b>Starts with</b> set to ${code("t")}: ${fmt(startsT.length)} words, from ${code(startsT[0])} to ${code(startsT.at(-1))}.</li>
</ul>
<h2>Common mistakes</h2>
<ul>
<li><b>Expecting a word that's not in the list.</b> Games disagree about many short and informal words. If a word you know is missing, it isn't in ENABLE. Read <a href="/guides/word-lists-explained">Word Lists Explained</a> for why.</li>
<li><b>Too many blanks.</b> Three blanks match a huge number of words. Use as few as you really have.</li>
<li><b>Forgetting a filter is on.</b> If results look thin, check the Advanced filters and the “Show all words” switch.</li>
</ul>
<h2>Limits and accuracy</h2>
<p>${ctx.WORDLIST_NOTE} The tool doesn't know your game's board, bonus squares or rules about outside help. Point values shown when you tap a word are commonly used tile values. Some vulgar words are hidden by default; the “Show all words” switch brings them back.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>The letters you type are processed in your browser and are not sent to Letterpile. They appear in the page address so that links can be shared. Definition lookups are the one exception: when you press “Look up definition”, that word is sent to a third-party dictionary service. See the <a href="/privacy-policy">Privacy Policy</a>.</p>
<h2>What people use it for</h2>
<p>Racks in tile games, the daily jumble, Text Twist rounds, crossword clues where you know the letters but not the order, and settling friendly arguments about whether a word exists in a particular list.</p>`,
    faq: [
      { q: "How do blank tiles work?", a: "Type a ? (or * or _) for each blank, up to three. A blank can stand for any letter. The tool uses your real letters first and marks the letters a blank had to fill with a dotted underline." },
      { q: "Why is a word I expected missing?", a: `Each game uses its own dictionary. This tool uses the open ENABLE word list, which doesn't include some words other lists have, such as ${code("qi")} and ${code("za")}. A few vulgar words are also hidden unless you turn on “Show all words”.` },
      { q: "Is what I type stored anywhere?", a: "No. Your letters are processed in your browser and are not sent to or stored by Letterpile. They appear in the page address so you can share a search, and only a definition lookup you ask for sends a word to a third-party service." },
      { q: "How many letters can I enter?", a: "Up to 15 letters plus up to 3 blanks. Longer inputs are rejected with a message, because results would be enormous and slow." },
      { q: "How many words are in the list?", a: `The ENABLE list has ${fmt(ctx.total)} words. ${fmt(ctx.blockedCount)} vulgar words and slurs are hidden by default.` },
      { q: "Can I use it while playing a game?", a: "It's a word-finding aid. Whether outside help is allowed depends on the game and the people you play with, so check your game's rules first." },
    ],
    related: [
      { href: "/anagram-solver", label: "Anagram Solver", note: "every-letter rearrangements, including two-word ones" },
      { href: "/scrabble-word-finder", label: "Tile Game Word Finder", note: "plays ranked by letter score" },
      { href: "/guides/how-word-unscramblers-work", label: "How Word Unscramblers Work" },
      { href: "/guides/two-letter-words", label: "Two-Letter Words" },
    ],
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Stuck on a seven-letter rack? Check the 7-letter group first: many tile games give a bonus for using all your tiles.</p></section>`,
  };
};
