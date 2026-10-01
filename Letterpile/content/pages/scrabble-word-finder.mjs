// Tile game word finder (/scrabble-word-finder). Live URL kept; "Scrabble" removed from
// the title, H1 and description (docs/DECISIONS.md). Copy reused and corrected for ENABLE.
export default ctx => {
  const twos = ["xu", "jo", "ax", "xi", "ka"];
  ctx.assertWords(twos);
  ctx.assertNotWords(["qi", "za"]);
  return {
    key: "scrabble", path: "/scrabble-word-finder", file: "scrabble-word-finder.html", type: "tool", script: "finder", scheme: "scrabble",
    appName: "Word Finder for Tile Games",
    title: "Tile Game Word Finder: Best Plays for Your Rack | Letterpile",
    description: "Enter your rack and board letters to see playable words ranked by letter score, with blank tiles and all-tiles bonuses.",
    h1: "Word Finder for Tile Games",
    lede: "Enter your rack to see every word you can make, ranked by points. Add letters already on the board to find words that build through them.",
    tool: ctx.finderForm(),
    prose: `<h2>Reading the results</h2>
        <p>Each tile shows the word's base score from the letter values commonly used in Scrabble-style games (shown in the sidebar). Blank tiles score zero, so a word that needs a blank is worth less than the same word from real tiles; the finder always spends your real tiles first. Words that use all seven of your tiles get the 50-point all-tiles bonus (commonly reported; check your game's rules) and a colored outline.</p>
        <h3>Using board letters</h3>
        <p>Type a letter or run of letters that's already on the board, such as <code>E</code> or <code>ING</code>, and the finder only shows words that pass through it. Those board tiles are counted in the score but don't come from your rack.</p>
        <h2>Strategy notes</h2>
        <ul>
          <li><b>Short words matter.</b> Two-letter words such as ${ctx.list(twos, 5)} (all in the ENABLE list) let you park a big tile on a premium square with parallel plays. Some games also accept <code>QI</code> and <code>ZA</code>, but they are not in the list this site uses.</li>
          <li><b>Keep a balanced leave.</b> After you play, the tiles you keep matter. A leave with a mix of vowels and common consonants gives you more options next turn than five consonants.</li>
          <li><b>Hold your S and blanks</b> for a play where they earn clearly more than they would right now.</li>
        </ul>
        <p>${ctx.WORDLIST_NOTE} Letterpile is not an official word source for any game.</p>`,
    sidebar: `<section class="panel"><h2>Common tile values</h2>${ctx.valuesTable("scrabble")}</section>
      <section class="panel tip"><h2>Tip</h2><p>Premium squares aren't counted here. A 12-point word on a triple-word square beats a 30-pointer in the open, so check the board before you pick.</p></section>`,
  };
};
