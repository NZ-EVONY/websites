import { listKit } from "../../lists.mjs";
export default ctx => {
  const { words, crumbs, visible, fmt, code, common } = listKit(ctx);
  const five = visible.filter(w => w.length === 5);
  const COMBOS = [["th", "TH"], ["ch", "CH"], ["sh", "SH"], ["ph", "PH"], ["wh", "WH"], ["ck", "CK"], ["qu", "QU"], ["ea", "EA"], ["ee", "EE"], ["oo", "OO"], ["ou", "OU"]];
  const groups = COMBOS.map(([c, C]) => {
    const ws = five.filter(w => w.includes(c));
    return { c, C, ws, everyday: ws.filter(common) };
  });
  return {
    key: "list-five", path: "/lists/five-letter-word-patterns", file: "lists/five-letter-word-patterns.html", type: "list",
    title: "5-Letter Words With TH, CH, SH, QU and More | Letterpile",
    description: "Five-letter words grouped by common letter pairs (TH, CH, SH, PH, WH, CK, QU, EA, EE, OO, OU), everyday words first, for daily guessing puzzles.",
    h1: "Five-letter words by letter pair",
    crumbs: crumbs("Five-letter words by letter pair", "/lists/five-letter-word-patterns"),
    prose: `<p>When a five-letter puzzle shows you two letters side by side, or you suspect a common pair like TH or CH, the possible answers shrink fast. These lists group the ${fmt(five.length)} five-letter words in our list by eleven of the most useful pairs. Within each pair, everyday words come first, because daily puzzles almost always choose a familiar answer; the rarer words follow.</p>
<h2>Using these lists</h2>
<ul>
<li><b>Pairs, not positions.</b> A word appears under a pair wherever the pair sits: ${code("thumb")}, ${code("other")} and ${code("teeth")} are all under TH.</li>
<li><b>One word, several pairs.</b> ${code("cheek")} is under both CH and EE.</li>
<li><b>Known positions?</b> If you already know where letters go, the <a href="/wordle-solver">Wordle Solver</a> or the <a href="/crossword-solver">Crossword Solver</a> will narrow it further.</li>
</ul>
${groups.map(g => `<h2>Five-letter words with ${g.C} <span class="count">${fmt(g.ws.length)}</span></h2>\n<p>${fmt(g.everyday.length)} everyday word${g.everyday.length === 1 ? "" : "s"}:</p>\n${words(g.everyday)}\n${g.ws.length > g.everyday.length ? `<p>Less common:</p>\n${words(g.ws.filter(w => !common(w)))}` : ""}`).join("\n")}`,
    faq: [
      { q: "Why are everyday words listed separately?", a: "Daily puzzles pick familiar answers. Splitting the lists lets you try the likely words first and keep the rare ones for later." },
      { q: "What counts as an everyday word?", a: "A word on a list of common English words (SCOWL, sizes 10 to 35). It's a guide, not a puzzle's answer list." },
      { q: "Can a word appear in more than one group?", a: "Yes. Any word containing two of the pairs, like CHEEK, is listed under both." },
      { q: "Where are the other five-letter words?", a: "The full list is on the 5-letter words page, linked below." },
    ],
    related: [{ href: "/words-by-length/5-letter-words", label: "All 5-letter words" }, { href: "/wordle-solver", label: "Wordle Solver" }, { href: "/multi-board-solver", label: "Multi-Board Word Solver" }, { href: "/guides/wordle-strategy", label: "Wordle strategy" }],
  };
};
