// Words With Friends finder. Copy reused from the live page.
export default ctx => ({
  key: "wwf", path: "/words-with-friends", file: "words-with-friends.html", type: "tool", script: "finder", scheme: "wwf",
  title: "Words With Friends Finder: High-Scoring Plays | Letterpile",
  description: "Find high-scoring plays for your tiles using commonly used Words With Friends letter values and the all-tiles bonus.",
  h1: "Words With Friends Word Finder",
  lede: "The same idea as the tile game word finder, scored with commonly used Words With Friends letter values and a 35-point bonus for playing all seven tiles.",
  tool: ctx.finderForm(),
  prose: `<h2>How Words With Friends scoring differs</h2>
        <p>The game looks like other crossword-style tile games but prices letters differently, so the best play for the same rack often changes. Notable differences in the commonly used values:</p>
        ${ctx.valueDiffTable()}
        <p>Playing all seven tiles is commonly reported to earn 35 points here rather than 50, so a big-tile play on a premium square often beats using every tile. Check your game's rules, as values and bonuses can change.</p>
        <h2>Tips</h2>
        <ul>
          <li>Two-letter plays with <code>J</code>, <code>X</code> and <code>Z</code> across double- or triple-letter squares can score in both directions.</li>
          <li>Letters that are cheap elsewhere, like L, N and U, are worth a little more here, so words packed with them can score better than you expect.</li>
        </ul>
        <p>Words With Friends uses its own dictionary. ${ctx.WORDLIST_NOTE} Expect some words here that the game rejects, and some newer words it accepts that are missing here.</p>`,
  sidebar: `<section class="panel"><h2>Words With Friends values</h2>${ctx.valuesTable("wwf")}</section>
      <section class="panel tip"><h2>Tip</h2><p>L, N and U are worth 2 here. A word packed with them scores better than you'd guess from other tile games.</p></section>`,
});
