// Guide: letter values and tile counts. Values come from engine.js (commonly used values);
// the 100-tile distribution from content/data/tile-distribution.json (sum tested = 100).
import fs from "node:fs";
import path from "node:path";

export default ctx => {
  const { code, fmt, Engine } = ctx;
  const dist = JSON.parse(fs.readFileSync(path.resolve("content/data/tile-distribution.json"), "utf8"));
  const V = Engine.SCHEMES.scrabble.values, W = Engine.SCHEMES.wwf.values;
  const letters = Object.keys(dist.tiles);
  const totalTiles = letters.reduce((s, l) => s + dist.tiles[l], 0) + dist.blanks;
  const totalPoints = letters.reduce((s, l) => s + dist.tiles[l] * V[l], 0);
  const vowels = ["a", "e", "i", "o", "u"].reduce((s, l) => s + dist.tiles[l], 0);
  // How common each letter is in the word list (share of all letters in all visible words).
  const freq = {}; let all = 0;
  for (const w of ctx.clean) for (const c of w) { freq[c] = (freq[c] || 0) + 1; all++; }
  const byValue = {};
  for (const l of letters) (byValue[V[l]] ||= []).push(l.toUpperCase());
  const rare = ["j", "q", "x", "z"].map(l => [l, freq[l]]);
  const common = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const pct = n => (100 * n / all).toFixed(2);
  const diff = letters.filter(l => V[l] !== W[l]);
  const example = ["quiz", "jinx", "faze", "rate"].filter(w => ctx.cleanSet.has(w));
  ctx.assertWords(example);
  return {
    key: "guide-values", path: "/guides/letter-values-and-tile-counts", file: "guides/letter-values-and-tile-counts.html", type: "guide",
    published: "2026-10-01",
    title: "Letter Values and Tile Counts in Word Games | Letterpile",
    description: "How points and tile counts are usually assigned to letters in English tile games, and what that means for your plays.",
    h1: "Letter Values and Tile Counts",
    prose: `<p class="summary">English tile games usually give common letters low points and rare letters high points, and they include more tiles of the common letters. This guide sets out the values and the 100-tile set most commonly used in Scrabble-style games, compares them with how often each letter actually appears in a word list, and explains what that means when you choose a play. Games differ, so check the rules and the tile set of the game you play.</p>
<!--@slot after-intro-->
<h2>Commonly used letter values</h2>
<p>These are the values Letterpile's <a href="/scrabble-word-finder">tile game word finder</a> uses. They are widely used in English crossword-style tile games, but they are not universal.</p>
<table>
<tr><th>Points</th><th>Letters</th></tr>
${Object.keys(byValue).map(Number).sort((a, b) => a - b).map(v => `<tr><td>${v}</td><td>${byValue[v].join(", ")}</td></tr>`).join("")}
<tr><td>0</td><td>Blank tiles</td></tr>
</table>
<h2>The 100-tile set</h2>
<p>The set most often used with those values has ${totalTiles} tiles: ${totalTiles - dist.blanks} lettered tiles and ${dist.blanks} blanks. The counts below are that common distribution. Some editions, other languages and other games use different numbers.</p>
<table>
<tr><th>Letter</th><th>Tiles</th><th>Points each</th></tr>
${letters.map(l => `<tr><td>${l.toUpperCase()}</td><td>${dist.tiles[l]}</td><td>${V[l]}</td></tr>`).join("")}
<tr><td>Blank</td><td>${dist.blanks}</td><td>0</td></tr>
</table>
<p>Adding it up: the lettered tiles are worth ${fmt(totalPoints)} points in total, and ${vowels} of the ${totalTiles} tiles are vowels (A, E, I, O, U), with Y counted separately. E alone has ${dist.tiles.e} tiles, more than any other letter.</p>
<!--@slot mid-article-->
<h2>Values compared with how often letters appear</h2>
<p>Point values are roughly the inverse of how common a letter is. You can see this in the word list itself. Counting every letter in every word Letterpile shows (${fmt(all)} letters in total), the most common are ${common.map(([c, n]) => `${c.toUpperCase()} (${pct(n)}%)`).join(", ")}. All of those are worth 1 point. The four rarest high-value letters appear far less often: ${rare.map(([c, n]) => `${c.toUpperCase()} ${pct(n)}%`).join(", ")}.</p>
<p>The match isn't perfect, because tile values were set for playing balance and for how easily a letter fits into words, not just how often it appears. Letter frequency in a long word list also differs from frequency in everyday writing, since the list counts each word once, however rare it is.</p>
<h2>What the numbers mean for your plays</h2>
<ul>
<li><b>Score comes from the letters and the squares.</b> A word's base score is just the sum of its letter values: ${example.map(w => `${code(w)} is ${Engine.score(w)}`).join(", ")}. Bonus squares on a board multiply letters or whole words, which is why a short word with one high-value letter on the right square can beat a long word of 1-point letters.</li>
<li><b>Blanks score zero.</b> A blank can be any letter, but it adds nothing to the score. Letterpile's finder spends your real tiles first so the score shown is the best that rack can make.</li>
<li><b>High-value tiles are few.</b> In the common set there is only one each of J, K, Q, X and Z. If one has been played, you know no other copy can turn up (unless there are blanks left).</li>
<li><b>Count what's left.</b> Because the set is fixed, players sometimes track which tiles have been played to judge what an opponent might hold. The table above is the starting point for that.</li>
</ul>
<h2>Why blanks are worth keeping</h2>
<p>A blank scores nothing, yet many players treat it as the most valuable tile in the set. The reason is flexibility: a blank can complete a word that no other tile could, and in games with an all-tiles bonus that one completed word can be worth far more than the letter it replaces. With only ${dist.blanks} blanks in the common set, it is usually worth waiting for a play that really needs one.</p>
<h2>Other games use other values</h2>
<p>Words With Friends, for example, is commonly reported to use a different set of values. Of the 26 letters, ${diff.length} have a different commonly used value there: ${diff.map(l => `${l.toUpperCase()} (${V[l]} vs ${W[l]})`).join(", ")}. Letterpile's <a href="/words-with-friends">Words With Friends finder</a> uses those values. Many games also have their own tile counts and bonuses, and some change them over time.</p>
<h2>A note on bonuses</h2>
<p>Many tile games give an extra bonus for using all seven tiles in one turn. It is commonly reported as 50 points in Scrabble-style games and 35 in Words With Friends. Letterpile adds those amounts in its finders, but you should check the rules of your own game.</p>`,
    related: [
      { href: "/scrabble-word-finder", label: "Tile Game Word Finder" },
      { href: "/words-with-friends", label: "Words With Friends Finder" },
      { href: "/guides/high-value-letters-j-q-x-z", label: "Using J, Q, X and Z" },
      { href: "/guides/rack-balance", label: "Rack Balance Explained" },
    ],
  };
};
