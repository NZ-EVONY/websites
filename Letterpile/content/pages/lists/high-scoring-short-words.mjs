import { listKit } from "../../lists.mjs";
export default ctx => {
  const { link, crumbs, visible, fmt, code } = listKit(ctx);
  const E = ctx.Engine;
  const pts = w => E.score(w, "scrabble");
  const groups = [[2, 5], [3, 8], [4, 12]].map(([n, min]) => ({ n, min, ws: visible.filter(w => w.length === n && pts(w) >= min).sort((a, b) => pts(b) - pts(a) || (a < b ? -1 : 1)) }));
  const best = groups.map(g => g.ws[0]);
  const table = ws => `<p class="wordlist">${ws.map(w => `${link(w)}<sub>${pts(w)}</sub>`).join(" ")}</p>`;
  return {
    key: "list-highscore", path: "/lists/high-scoring-short-words", file: "lists/high-scoring-short-words.html", type: "list",
    title: "High-Scoring Short Words: 2, 3 and 4 Letters | Letterpile",
    description: `The best-scoring two-, three- and four-letter words in our list, ranked by points with common tile values: ${fmt(groups.reduce((n, g) => n + g.ws.length, 0))} words in all.`,
    h1: "High-scoring short words",
    crumbs: crumbs("High-scoring short words", "/lists/high-scoring-short-words"),
    prose: `<p>A short word on the right square can outscore a long one in the middle of the board. These lists rank two-, three- and four-letter words by their points with the common tile values, highest first, with each word's score after it. Two-letter words scoring ${groups[0].min} or more, three-letter words scoring ${groups[1].min} or more and four-letter words scoring ${groups[2].min} or more are included. The top of each group: ${best.map(w => `${code(w)} (${pts(w)})`).join(", ")}.</p>
<h2>How to use these</h2>
<ul>
<li><b>Aim for the bonus squares.</b> Put the heavy letter on a double or triple letter square, and if the word also forms a second word, it scores twice.</li>
<li><b>Play parallel.</b> Short words laid alongside an existing word form several two-letter words at once; every one of them scores.</li>
<li><b>Mind what you open.</b> A short word next to a triple word square can hand your opponent a bigger play.</li>
</ul>
${groups.map(g => `<h2>${g.n}-letter words worth ${g.min} or more <span class="count">${fmt(g.ws.length)}</span></h2>\n${table(g.ws)}`).join("\n")}
<p>Values differ in Words With Friends; the <a href="/guides/letter-values-and-tile-counts">letter values guide</a> compares the two.</p>`,
    faq: [
      { q: "What's the highest-scoring two-letter word?", a: `${best[0].toUpperCase()}, at ${pts(best[0])} points with the common tile values, before bonus squares.` },
      { q: "Do the scores include bonus squares?", a: "No. They're the plain letter totals; bonus squares and crossing words add to them in a real game." },
      { q: "Why are some unfamiliar words here?", a: "Short, high-scoring words are often borrowed or rare words. They're all in the ENABLE list; check your own game's dictionary." },
      { q: "Are Words With Friends scores different?", a: "Yes. Several letters have different values there, so the order of these lists would change." },
    ],
    related: [{ href: "/lists/two-and-three-letter-words", label: "Two- and three-letter words" }, { href: "/board-solver", label: "Board Solver" }, { href: "/lists/words-with-z", label: "Words with Z" }, { href: "/guides/letter-values-and-tile-counts", label: "Letter values and tile counts" }],
  };
};
