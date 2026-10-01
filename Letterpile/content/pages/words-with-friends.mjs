// Words With Friends finder. Copy reused from the live page and expanded; examples computed.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const rack = "lunaret";
  const wwf = Engine.findPlays(rack, { scheme: "wwf" });
  const scr = Engine.findPlays(rack, { scheme: "scrabble" });
  const rankW = wwf.slice(0, 3), rankS = scr.slice(0, 3);
  const h = "hymn";
  ctx.assertWords([h, "jab", "lull"]);
  return {
    key: "wwf", path: "/words-with-friends", file: "words-with-friends.html", type: "tool", script: "finder", scheme: "wwf",
    title: "Words With Friends Finder: High-Scoring Plays | Letterpile",
    description: "Find high-scoring plays for your tiles using commonly used Words With Friends letter values and the all-tiles bonus.",
    h1: "Words With Friends Word Finder",
    lede: "The same idea as the tile game word finder, scored with commonly used Words With Friends letter values and a 35-point bonus for playing all seven tiles.",
    tool: ctx.finderForm(),
    prose: `<p>Words With Friends looks like other crossword-style tile games, but it prices several letters differently, so the best-scoring word for a rack can change. This finder lists every word your tiles can make from Letterpile's word list and ranks them with the letter values commonly reported for Words With Friends, plus a 35-point bonus for using all seven tiles. Add board letters to build through them. Scores are base values only; the board's bonus squares are up to you.</p>
<!--@slot after-intro-->
<h2>How Words With Friends scoring differs</h2>
<p>The table lists every letter whose commonly used value differs from the values used in Scrabble-style games:</p>
${ctx.valueDiffTable()}
<p>Playing all seven tiles is commonly reported to earn 35 points here rather than 50, so a big-tile play on a premium square often beats using every tile. Check your game's rules, as values and bonuses can change.</p>
<h2>How to use it</h2>
<ol>
<li>Enter your tiles in <b>Your rack</b>, with <kbd>?</kbd> for a blank.</li>
<li>Add any board letters you want to play through.</li>
<li>Use <b>Advanced filters</b> if the word must start, end or contain certain letters, or be a set length.</li>
<li>Press <b>Find words</b>, then choose “Highest score first” or “Grouped by length”.</li>
</ol>
<h2>Same rack, different ranking</h2>
<p>To see why separate values matter, here is the rack ${code(rack)} scored both ways. With Words With Friends values the top plays are ${rankW.map(p => `${code(p.word)} (${p.score})`).join(", ")}. With the values used by Scrabble-style games they are ${rankS.map(p => `${code(p.word)} (${p.score})`).join(", ")}. Letters like L, N and U, worth 2 here instead of 1, push some words up the list.</p>
<p>A few more comparisons by base score: ${[h, "jab", "lull"].map(w => `${code(w)} is ${Engine.score(w, "wwf")} here and ${Engine.score(w, "scrabble")} with the other values`).join("; ")}.</p>
<h2>Reading the results</h2>
<p>Each word shows its base score. Outlined words use all seven of your tiles and include the 35-point bonus. Letters underlined with dots come from a blank and score nothing. Switch to “Grouped by length” to see the longest options together.</p>
<h2>Tips</h2>
<ul>
<li>Two-letter plays with <code>J</code>, <code>X</code> and <code>Z</code> across double- or triple-letter squares can score in both directions.</li>
<li>Letters that are cheap elsewhere, like L, N and U, are worth a little more here, so words packed with them can score better than you expect.</li>
<li>Because the all-tiles bonus is smaller, don't hold tiles back for a seven-letter play as long as you might in other games.</li>
</ul>
<h2>Common mistakes</h2>
<ul>
<li><b>Using the other finder by habit.</b> The <a href="/scrabble-word-finder">tile game word finder</a> ranks with different values; pick the one that matches your game.</li>
<li><b>Ignoring the board.</b> Premium squares can be worth far more than the difference between two words in this list.</li>
</ul>
<h2>Limits and accuracy</h2>
<p>Words With Friends uses its own dictionary. ${ctx.WORDLIST_NOTE} Expect some words here that the game rejects, and some newer words it accepts that are missing here. Letterpile is independent and not affiliated with Zynga.</p>
<h2>Privacy</h2>
<p>Your tiles are processed in your browser and never sent to Letterpile. A definition is fetched from a third-party dictionary only if you ask for one.</p>`,
    faq: [
      { q: "Where do these letter values come from?", a: "They are the values commonly reported for the game, not taken from an official source. Check the values shown in your game, as they may change." },
      { q: "Why is the all-tiles bonus 35 and not 50?", a: "35 points is the bonus commonly reported for Words With Friends. Other tile games commonly use 50. Check your game's rules." },
      { q: "Will the game accept every word listed?", a: "Not necessarily. The game has its own dictionary, and Letterpile uses the open ENABLE word list. Use the results as suggestions and let the game confirm them." },
      { q: "Do the scores include double and triple squares?", a: "No. The finder can't see your board, so scores are base tile values plus the all-tiles bonus." },
      { q: "Can I search for words that use a letter on the board?", a: "Yes. Type the board letters, in order, in the board box. Only words that pass through them are shown." },
    ],
    related: [
      { href: "/scrabble-word-finder", label: "Tile Game Word Finder" },
      { href: "/guides/letter-values-and-tile-counts", label: "Letter Values and Tile Counts" },
      { href: "/guides/rack-balance", label: "Rack Balance Explained" },
      { href: "/guides/hooks-prefixes-and-suffixes", label: "Hooks, Prefixes and Suffixes" },
    ],
    sidebar: `<section class="panel"><h2>Words With Friends values</h2>${ctx.valuesTable("wwf")}</section>
      <section class="panel tip"><h2>Tip</h2><p>L, N and U are worth 2 here. A word packed with them scores better than you'd guess from other tile games.</p></section>`,
  };
};
