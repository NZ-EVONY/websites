// Hub: /words-by-length. Rendered after the generated pages (late) so it links only to pages that exist.
export const late = true;
export default ctx => {
  const t = ctx.tree;
  const fmt = ctx.fmt;
  const visible = t.helpers.set.size;
  const nodes = t.nodes.filter(n => n.family === "length" && !n.parent);
  const byLen = {};
  for (const w of t.helpers.set) byLen[w.length] = (byLen[w.length] || 0) + 1;
  const lens = Object.keys(byLen).map(Number).sort((a, b) => a - b);
  const peak = lens.reduce((a, b) => (byLen[b] > byLen[a] ? b : a));
  const long = lens.filter(n => n > 15).reduce((s, n) => s + byLen[n], 0);
  const max = lens.at(-1);
  const pct = n => (100 * n / visible).toFixed(1);
  return {
    key: "hub-length", path: "/words-by-length", file: "words-by-length.html", type: "hub",
    title: "Words by Length: 2 to 15 Letter Word Lists | Letterpile",
    description: "Browse word lists from 2 to 15 letters, with counts, patterns and examples from a free, open word list.",
    h1: "Words by Length",
    prose: `<p>These lists sort every word that Letterpile shows by how many letters it has, from two-letter words up to fifteen. Each list comes from the open ENABLE word list with vulgar words left out, and every number on these pages is counted from that list when the site is built. ${ctx.WORDLIST_NOTE}</p>
<!--@slot after-intro-->
<h2>How the lists are organized</h2>
<p>Short lists are shown in full on one page. Once a length has more than 5,000 words, its page becomes an overview with links to smaller pages, one for each starting letter, so that no single page is too long to read or load comfortably. Starting letters with fewer than 100 words don't get a page of their own; they are listed in full at the bottom of the overview instead, so every word still appears somewhere.</p>
<p>Each list page adds a few facts worked out from its own words: the longest and shortest entries, the word with the highest base score using commonly used tile values, how many words repeat no letter, and patterns such as the most common endings. Those facts are meant to help with puzzles, not to rank words by how common they are in everyday English, which the list itself can't tell you.</p>
<h2>Words per length</h2>
<div class="table-wrap"><table><tr><th>Length</th><th>Words</th><th>Share of the list</th></tr>
${lens.filter(n => n <= 15).map(n => `<tr><td>${n} letters</td><td>${fmt(byLen[n])}</td><td>${pct(byLen[n])}%</td></tr>`).join("")}
<tr><td>16 letters and longer</td><td>${fmt(long)}</td><td>${pct(long)}%</td></tr></table></div>
<h2>What the numbers show</h2>
<ul>
<li>The most common length is ${peak} letters, with ${fmt(byLen[peak])} words. Lists of medium-length words are long because English adds prefixes and endings such as -ed, -ing and -s to shorter words.</li>
<li>There are only ${fmt(byLen[2])} two-letter words and ${fmt(byLen[3])} three-letter words, which is why short words are worth learning by heart for tile games: there are few enough to memorize.</li>
<li>The longest words in the list have ${max} letters. Words longer than fifteen letters (${fmt(long)} of them) don't have length pages here because most board games can't fit them, but each one still appears in the <a href="/words-starting-with">Words Starting With</a> lists.</li>
</ul>
<h2>Choose a length</h2>
<ul class="link-cols">${nodes.map(n => `<li><a href="${n.path}">${n.n}-letter words</a> <span class="count">${fmt(n.words.length)}</span></li>`).join("")}</ul>
<h2>Using length lists</h2>
<p>Length lists are most useful when you already know how many squares you have to fill: a crossword answer, a Wordle-style puzzle, or a gap on a game board. If you also know some of the letters, the <a href="/crossword-solver">Crossword Solver</a> takes a pattern with question marks for the gaps, which is faster than scanning a long list. If you know the letters but not their order, the <a href="/">Word Unscrambler</a> has a length filter. For background on why word lists differ, read <a href="/guides/word-lists-explained">Word Lists Explained</a>.</p>`,
    related: [
      { href: "/guides/two-letter-words", label: "Two-Letter Words: The Full List" },
      { href: "/words-starting-with", label: "Words Starting With" },
      { href: "/words-ending-in", label: "Words Ending In" },
      { href: "/crossword-solver", label: "Crossword Solver" },
    ],
  };
};
