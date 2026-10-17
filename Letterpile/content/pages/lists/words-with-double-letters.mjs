import { listKit } from "../../lists.mjs";
export default ctx => {
  const { words, crumbs, visible, fmt, code } = listKit(ctx);
  const very = w => ctx.WordTools.tier(w) === 2;
  const all = visible.filter(w => /(.)\1/.test(w));
  const shown = all.filter(very);
  const by = new Map();
  for (const w of shown) for (const m of new Set([...w.matchAll(/(.)\1/g)].map(x => x[1]))) { if (!by.has(m)) by.set(m, []); by.get(m).push(w); }
  const groups = [...by].sort((a, b) => b[1].length - a[1].length);
  const triple = all.filter(w => /(.)\1\1/.test(w));
  return {
    key: "list-double", path: "/lists/words-with-double-letters", file: "lists/words-with-double-letters.html", type: "list",
    title: "Words With Double Letters, by Letter | Letterpile",
    description: `${fmt(shown.length)} very common words with a doubled letter (LL, EE, SS, OO and more), grouped by the letter that doubles.`,
    h1: "Words with double letters",
    crumbs: crumbs("Words with double letters", "/lists/words-with-double-letters"),
    prose: `<p>Doubled letters trip up guessers and spellers alike. In five-letter puzzles, a double letter is a classic reason a sensible guess fails: the answer was ${code("apple")} or ${code("floor")} and nobody thought to repeat a letter. Our list has ${fmt(all.length)} words with at least one doubled letter, far too many to read, so this page keeps the ${fmt(shown.length)} very common ones and groups them by the letter that doubles, most frequent pairs first.</p>
<h2>Patterns worth knowing</h2>
<ul>
<li><b>The usual doubles</b> are L, E, S, O, T and F. ${groups.slice(0, 3).map(([m]) => code(m + m)).join(", ")} lead this list.</li>
<li><b>Some letters almost never double</b> in English: there's no common word with a doubled Q, X or J.</li>
<li><b>Triples are rare.</b> Only ${fmt(triple.length)} word${triple.length === 1 ? "" : "s"} in the whole list ${triple.length === 1 ? "has" : "have"} the same letter three times in a row.</li>
<li><b>Two doubles.</b> Words like ${code("coffee")} and ${code("committee")} appear under each letter they double.</li>
</ul>
${groups.map(([m, ws]) => `<h2>Double ${m.toUpperCase()} <span class="count">${fmt(ws.length)}</span></h2>\n${words(ws)}`).join("\n")}`,
    faq: [
      { q: "Which letter doubles most often?", a: `Among very common words, ${groups[0][0].toUpperCase()}: ${fmt(groups[0][1].length)} words on this page have ${groups[0][0].toUpperCase()}${groups[0][0].toUpperCase()}.` },
      { q: "Why only very common words?", a: `There are ${fmt(all.length)} words with a double letter in the whole list. Keeping the very common ones (SCOWL size 10 to 20) makes the page usable.` },
      { q: "Do any words triple a letter?", a: triple.length ? `A few: ${triple.slice(0, 5).map(w => w.toUpperCase()).join(", ")}.` : "None in our list." },
      { q: "How do double letters affect daily puzzles?", a: "A gray tile on a repeated letter only rules out extra copies. If you're stuck, try a guess that repeats a likely letter." },
    ],
    related: [{ href: "/lists/five-letter-word-patterns", label: "Five-letter words by letter pair" }, { href: "/wordle-solver", label: "Wordle Solver" }, { href: "/guides/wordle-strategy", label: "Wordle strategy" }, { href: "/words-by-length", label: "Words by length" }],
  };
};
