// Hub: /words-ending-in. Also lists in full the last letters too rare for their own page.
export const late = true;
export default ctx => {
  const t = ctx.tree, fmt = ctx.fmt;
  const visible = t.helpers.set.size;
  const tops = t.nodes.filter(n => n.family === "ends" && !n.parent && !n.standalone);
  const curated = t.nodes.filter(n => n.family === "ends" && n.curated);
  const counts = tops.map(n => [n.key, n.words.length]).sort((a, b) => b[1] - a[1]);
  const pct = n => (100 * n / visible).toFixed(1);
  const rare = t.rootFolded.ends.slice().sort();
  const rareBy = {};
  for (const w of rare) (rareBy[w.at(-1)] ||= []).push(w);
  return {
    key: "hub-ends", path: "/words-ending-in", file: "words-ending-in.html", type: "hub",
    title: "Words Ending In: Browse by Letter or Suffix | Letterpile",
    description: "Browse words that end with any letter or common suffixes such as -ing, -ed and -ly, with counts and examples.",
    h1: "Words Ending In",
    wordsListed: rare,
    prose: `<p>Endings are where English grammar shows up most clearly in a word list: plurals, past tenses, adverbs and comparatives all add letters at the end. Pick a final letter or a common suffix to see every matching word from the open ENABLE word list, with vulgar words left out. All counts are worked out from that list when the site is built. ${ctx.WORDLIST_NOTE}</p>
<!--@slot after-intro-->
<h2>Browse by last letter</h2>
<ul class="link-cols">${tops.map(n => `<li><a href="${n.path}">…${n.key.toUpperCase()}</a> <span class="count">${fmt(n.words.length)}</span></li>`).join("")}</ul>
<p>Big groups are split by the letter that comes before, so “words ending in S” leads to lists for -AS, -ES, -RS and so on, and very large ones such as -ES are split once more. Every word in the list appears on at least one page.</p>
<h2>Common suffixes</h2>
<p>These pages explain what the suffix usually does, with examples, next to the full list and the computed facts. Any word that ends with the letters is counted, suffix or not, and each page shows how many entries leave another word when the ending is removed.</p>
<ul class="link-cols">${curated.map(n => `<li><a href="${n.path}">-${n.key.toUpperCase()}</a> <span class="count">${fmt(n.words.length)}</span></li>`).join("")}</ul>
<h2>Which letters end the most words</h2>
<div class="table-wrap"><table><tr><th>Last letter</th><th>Words</th><th>Share of the list</th></tr>
${counts.slice(0, 8).map(([k, n]) => `<tr><td>${k.toUpperCase()}</td><td>${fmt(n)}</td><td>${pct(n)}%</td></tr>`).join("")}</table></div>
<ul>
<li>${counts[0][0].toUpperCase()} ends ${fmt(counts[0][1])} words, far more than any other letter, because the list includes plural nouns and verb forms such as “runs”.</li>
<li>${counts[1][0].toUpperCase()} (${fmt(counts[1][1])}) and ${counts[2][0].toUpperCase()} (${fmt(counts[2][1])}) come next; the -ed past tense is one reason D ranks high.</li>
<li>Only ${fmt(rare.length)} words end in ${Object.keys(rareBy).sort().map(c => c.toUpperCase()).join(", ")} combined, too few for pages of their own, so they are listed in full below.</li>
</ul>
<h2>Words ending in rare letters</h2>
${Object.keys(rareBy).sort().map(c => `<h3>Ending in ${c.toUpperCase()} <span class="count">${rareBy[c].length}</span></h3>\n<p class="wordlist">${rareBy[c].join(" ")}</p>`).join("\n")}
<h2>Using these lists</h2>
<p>Endings matter when a word has to finish on a particular square, or when you want to extend a word that is already on a board. The <a href="/">Word Unscrambler</a> has an <b>Ends with</b> filter, and the <a href="/crossword-solver">Crossword Solver</a> takes patterns like ???ING. For how suffixes and back hooks work in games, read <a href="/guides/hooks-prefixes-and-suffixes">Hooks, Prefixes and Suffixes</a>.</p>`,
    related: [
      { href: "/words-starting-with", label: "Words Starting With" },
      { href: "/words-by-length", label: "Words by Length" },
      { href: "/guides/hooks-prefixes-and-suffixes", label: "Hooks, Prefixes and Suffixes" },
      { href: "/crossword-solver", label: "Crossword Solver" },
    ],
  };
};
