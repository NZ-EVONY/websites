// Tile game word finder (/scrabble-word-finder). Live URL kept; "Scrabble" removed from
// the title, H1 and description (docs/DECISIONS.md). Copy reused, corrected and expanded.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const twos = ["xu", "jo", "ax", "xi", "ka"];
  ctx.assertWords(twos);
  ctx.assertNotWords(["qi", "za"]);
  const rack = "retains";
  const plays = Engine.findPlays(rack, { scheme: "scrabble" });
  const top = plays.slice(0, 3);
  const allTiles = plays.filter(p => p.bingo).map(p => p.word);
  const board = Engine.findPlays("rtnae", { scheme: "scrabble", board: "ing" }).slice(0, 3);
  const blankRack = Engine.findPlays("quiz?", { scheme: "scrabble" }).slice(0, 3);
  return {
    key: "scrabble", path: "/scrabble-word-finder", file: "scrabble-word-finder.html", type: "tool", script: "finder", scheme: "scrabble",
    appName: "Word Finder for Tile Games",
    title: "Tile Game Word Finder: Best Plays for Your Rack | Letterpile",
    description: "Enter your rack and board letters to see playable words ranked by letter score, with blank tiles and all-tiles bonuses.",
    h1: "Word Finder for Tile Games",
    lede: "Enter your rack to see every word you can make, ranked by points. Add letters already on the board to find words that build through them.",
    tool: ctx.finderForm(),
    prose: `<p>This finder is for crossword-style tile games where you hold a rack of up to seven letters. Type your rack, with <kbd>?</kbd> for a blank, and it lists every word your tiles can make, highest score first, using the letter values commonly used in Scrabble-style games. Add a letter or a run of letters already on the board and it shows only words that pass through them. Scores are base tile values: the finder can't see your board's bonus squares, so use the list to spot options and the board to choose between them.</p>
<h2>How to use it</h2>
<ol>
<li>Type your rack in <b>Your rack</b>, up to 7 letters. Use <kbd>?</kbd> for each blank tile (up to two).</li>
<li>Optionally type a letter or run of letters from the board in <b>Letters on board</b>, such as <code>E</code> or <code>ING</code>.</li>
<li>Optionally narrow by start, end, contents or length under <b>Advanced filters</b>.</li>
<li>Press <b>Find words</b>. Switch the view between “Highest score first” and “Grouped by length”.</li>
<li>Tap a word for its points and an optional definition.</li>
</ol>
<!--@slot after-intro-->
<h2>Reading the results</h2>
<p>Each tile shows the word's base score from the letter values commonly used in Scrabble-style games (listed in the sidebar). Blank tiles score zero, so a word that needs a blank is worth less than the same word from real tiles; the finder always spends your real tiles first. Words that use all seven of your tiles get the 50-point all-tiles bonus (commonly reported; check your game's rules) and a colored outline.</p>
<h3>Using board letters</h3>
<p>Type a letter or run of letters that's already on the board and the finder only shows words that pass through it. Those board tiles are counted in the score but don't come from your rack. The finder treats them as one continuous run; it doesn't know about gaps between board letters or what else is nearby.</p>
<h2>Worked examples</h2>
<ul>
<li>The rack ${code(rack)} can make ${fmt(plays.length)} words. The top three by base score are ${top.map(p => `${code(p.word)} (${p.score})`).join(", ")}. ${allTiles.length ? `${fmt(allTiles.length)} of them use all seven tiles: ${ctx.list(allTiles, allTiles.length)}.` : ""}</li>
<li>The rack ${code("rtnae")} with ${code("ing")} on the board: the best base scores are ${board.map(p => `${code(p.word)} (${p.score})`).join(", ")}, each built through the board's I, N and G.</li>
<li>With a blank, ${code("quiz?")} scores best with ${blankRack.map(p => `${code(p.word)} (${p.score})`).join(", ")}. The blank's letter scores nothing.</li>
</ul>
<h2>Strategy notes</h2>
<ul>
<li><b>Short words matter.</b> Two-letter words such as ${ctx.list(twos, 5)} (all in the ENABLE list) let you park a big tile on a premium square with parallel plays. Some games also accept <code>QI</code> and <code>ZA</code>, but they are not in the list this site uses.</li>
<li><b>Keep a balanced leave.</b> After you play, the tiles you keep matter. A leave with a mix of vowels and common consonants gives you more options next turn than five consonants. See <a href="/guides/rack-balance">Rack Balance Explained</a>.</li>
<li><b>Hold your S and blanks</b> for a play where they earn clearly more than they would right now.</li>
</ul>
<h2>Common mistakes</h2>
<ul>
<li><b>Picking the top score without looking at the board.</b> A modest word on a triple-word square often beats the list's top entry.</li>
<li><b>Typing board letters that aren't in a line.</b> The board field means letters in one continuous run, in order.</li>
<li><b>Counting on a word your game rejects.</b> The finder knows only its own list.</li>
</ul>
<h2>Limits and accuracy</h2>
<p>${ctx.WORDLIST_NOTE} Letterpile is not an official word source for any game. Values and the all-tiles bonus are commonly used figures, not a rulebook. Bonus squares, crossing words and the tiles left in the bag are not considered.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>Your rack and board letters stay in your browser; nothing is sent to Letterpile. Only a definition lookup you choose sends that one word to a dictionary service.</p>`,
    faq: [
      { q: "Which letter values does it use?", a: "The values commonly used in English Scrabble-style tile games, shown in the sidebar: for example E is 1, K is 5, J and X are 8, Q and Z are 10. Your game may use different values." },
      { q: "Does it include bonus squares?", a: "No. Scores are base tile values plus the commonly reported 50-point bonus for using all seven tiles. The finder can't see your board." },
      { q: "How do blanks work?", a: "Type ? for each blank, up to two. A blank can be any letter but scores zero. The finder uses your real tiles first, and dotted letters in the results show where a blank is needed." },
      { q: "Why does it show words my game doesn't allow?", a: "It uses the open ENABLE word list, which differs from game dictionaries in both directions. Always check a word with your game before relying on it." },
      { q: "What does the board letters box do?", a: "It keeps only words that pass through the letters you type there, in that order. Those letters count toward the score but don't come from your rack." },
      { q: "Is this site connected to the makers of Scrabble?", a: "No. Letterpile is independent and is not affiliated with, endorsed by or sponsored by Hasbro, Mattel or any game publisher." },
    ],
    related: [
      { href: "/words-with-friends", label: "Words With Friends Finder" },
      { href: "/guides/letter-values-and-tile-counts", label: "Letter Values and Tile Counts" },
      { href: "/guides/two-letter-words", label: "Two-Letter Words" },
      { href: "/guides/high-value-letters-j-q-x-z", label: "Using J, Q, X and Z" },
    ],
    sidebar: `<section class="panel"><h2>Common tile values</h2>${ctx.valuesTable("scrabble")}</section>
      <section class="panel tip"><h2>Tip</h2><p>Premium squares aren't counted here. A 12-point word on a triple-word square beats a 30-pointer in the open, so check the board before you pick.</p></section>`,
  };
};
