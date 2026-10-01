// Hub: /words-starting-with.
export const late = true;
export default ctx => {
  const t = ctx.tree, fmt = ctx.fmt;
  const visible = t.helpers.set.size;
  const tops = t.nodes.filter(n => n.family === "starts" && !n.parent && !n.standalone);
  const curated = t.nodes.filter(n => n.family === "starts" && n.curated);
  const counts = tops.map(n => [n.key, n.words.length]).sort((a, b) => b[1] - a[1]);
  const pct = n => (100 * n / visible).toFixed(1);
  const fewest = counts.at(-1);
  return {
    key: "hub-starts", path: "/words-starting-with", file: "words-starting-with.html", type: "hub",
    title: "Words Starting With: Browse by Letter or Prefix | Letterpile",
    description: "Browse words that start with any letter or common prefixes such as un-, re- and pre-, with counts and examples.",
    h1: "Words Starting With",
    prose: `<p>Pick a letter to see every word that starts with it, or one of the common prefixes listed further down. The lists come from the open ENABLE word list, with vulgar words left out, and all counts are worked out from that list when the site is built. ${ctx.WORDLIST_NOTE}</p>
<!--@slot after-intro-->
<h2>Browse by first letter</h2>
<ul class="link-cols">${tops.map(n => `<li><a href="${n.path}">${n.key.toUpperCase()}</a> <span class="count">${fmt(n.words.length)}</span></li>`).join("")}</ul>
<p>Letters with a lot of words are split again by their second letter, so a page such as “words starting with S” is an overview that links to lists for SA, SC, SH and so on. Two-letter starts with fewer than 100 words are shown in full on the overview page. Every word in the list appears on at least one of these pages.</p>
<h2>Common prefixes</h2>
<p>These pages add a short explanation of what the prefix does, with examples, alongside the full list and the computed facts. A word only has to start with the letters to be counted, so the lists include some words where the letters are not really a prefix; each page shows how many entries still form a word when the prefix is removed.</p>
<ul class="link-cols">${curated.map(n => `<li><a href="${n.path}">${n.key.toUpperCase()}-</a> <span class="count">${fmt(n.words.length)}</span></li>`).join("")}</ul>
<h2>Which letters start the most words</h2>
<div class="table-wrap"><table><tr><th>First letter</th><th>Words</th><th>Share of the list</th></tr>
${counts.slice(0, 8).map(([k, n]) => `<tr><td>${k.toUpperCase()}</td><td>${fmt(n)}</td><td>${pct(n)}%</td></tr>`).join("")}</table></div>
<ul>
<li>${counts[0][0].toUpperCase()} starts more words than any other letter (${fmt(counts[0][1])}), followed by ${counts[1][0].toUpperCase()} (${fmt(counts[1][1])}) and ${counts[2][0].toUpperCase()} (${fmt(counts[2][1])}).</li>
<li>${fewest[0].toUpperCase()} starts the fewest words of the letters listed here (${fmt(fewest[1])}).</li>
<li>Prefixes explain part of the pattern: letters that begin common prefixes, such as the S of sub- and super- or the P of pre- and pro-, tend to start many words.</li>
</ul>
<h2>Using these lists</h2>
<p>A starting letter is often the first thing you know: a crossword answer with one letter filled in, or a word that has to join a letter already on the board. For your own letters, the <a href="/">Word Unscrambler</a> has a <b>Starts with</b> filter, and the <a href="/crossword-solver">Crossword Solver</a> takes patterns like A???E. The guide to <a href="/guides/hooks-prefixes-and-suffixes">hooks, prefixes and suffixes</a> explains how adding letters to the front of a word creates new plays.</p>`,
    related: [
      { href: "/words-ending-in", label: "Words Ending In" },
      { href: "/words-by-length", label: "Words by Length" },
      { href: "/guides/hooks-prefixes-and-suffixes", label: "Hooks, Prefixes and Suffixes" },
      { href: "/", label: "Word Unscrambler" },
    ],
  };
};
