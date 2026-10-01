// Guide: hooks, prefixes and suffixes. All hook examples computed from the shipped list.
// Rendered late so the affix table only links to pages that passed the quality gate.
export const late = true;
export default ctx => {
  const { code, fmt } = ctx;
  const S = ctx.cleanSet;
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  const front = w => letters.filter(l => S.has(l + w));
  const back = w => letters.filter(l => S.has(w + l));
  const demo = ["are", "at", "ate", "lap", "rate"].filter(w => S.has(w));
  ctx.assertWords(demo);
  // Which letter is the most common back hook / front hook across all words?
  const backCount = {}, frontCount = {};
  for (const w of ctx.clean) {
    if (w.length < 3) continue;
    const head = w.slice(1), tail = w.slice(0, -1);
    if (S.has(tail)) backCount[w.at(-1)] = (backCount[w.at(-1)] || 0) + 1;
    if (S.has(head)) frontCount[w[0]] = (frontCount[w[0]] || 0) + 1;
  }
  const topBack = Object.entries(backCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topFront = Object.entries(frontCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const twoNoHook = ctx.clean.filter(w => w.length === 2 && !front(w).length && !back(w).length);
  const three = ctx.clean.filter(w => w.length === 3);
  const noS = three.filter(w => !S.has(w + "s"));
  const prefixes = ["un", "re", "pre", "dis", "mis", "non", "out", "over", "sub", "anti"];
  const suffixes = ["ing", "ed", "ly", "er", "est", "ness", "ful", "less", "tion", "able", "ment", "ous", "ish"];
  const nodes = ctx.tree.byPath;
  const affixRow = (a, fam) => {
    const p = fam === "starts" ? `/words-starting-with/${a}` : `/words-ending-in/${a}`;
    const n = nodes.get(p);
    if (!n) return "";
    const stems = n.words.filter(w => S.has(fam === "starts" ? w.slice(a.length) : w.slice(0, -a.length))).length;
    return `<tr><td><a href="${p}">${fam === "starts" ? a.toUpperCase() + "-" : "-" + a.toUpperCase()}</a></td><td>${fmt(n.words.length)}</td><td>${fmt(stems)}</td></tr>`;
  };
  return {
    key: "guide-hooks", path: "/guides/hooks-prefixes-and-suffixes", file: "guides/hooks-prefixes-and-suffixes.html", type: "guide",
    published: "2026-10-01",
    title: "Hooks, Prefixes and Suffixes in Word Games | Letterpile",
    description: "How adding a letter to the front or back of a word creates new plays, with common prefixes, suffixes and examples.",
    h1: "Hooks, Prefixes and Suffixes",
    prose: `<p class="summary">A <b>hook</b> is a single letter you can add to the front or back of a word to make another word, like adding S to ${code("rate")} to make ${code("rates")}. Prefixes and suffixes are the same idea with longer pieces, such as UN- or -ING. In crossword-style tile games, hooks let one play form two words at once, so knowing them opens up many more places on the board. Every example here comes from Letterpile's word list. ${ctx.WORDLIST_NOTE}</p>
<!--@slot after-intro-->
<h2>Front hooks and back hooks</h2>
<p>A front hook goes before the word; a back hook goes after it. Here are all the hooks in the list for a few short words:</p>
<table>
<tr><th>Word</th><th>Front hooks</th><th>Back hooks</th></tr>
${demo.map(w => `<tr><td>${code(w)}</td><td>${front(w).map(l => l.toUpperCase()).join(" ") || "none"}</td><td>${back(w).map(l => l.toUpperCase()).join(" ") || "none"}</td></tr>`).join("")}
</table>
<p>So ${code("at")} with a front hook B gives ${code("bat")}, and with a back hook E gives ${code("ate")}. A single word can have many hooks or none.</p>
<h2>Which letters hook most often</h2>
<p>Counting every word of three letters or more that is another word plus one letter:</p>
<table>
<tr><th>Most common back hooks</th><th>Words made</th><th>Most common front hooks</th><th>Words made</th></tr>
${topBack.map(([l, n], i) => `<tr><td>${l.toUpperCase()}</td><td>${fmt(n)}</td><td>${topFront[i][0].toUpperCase()}</td><td>${fmt(topFront[i][1])}</td></tr>`).join("")}
</table>
<p>${topBack[0][0].toUpperCase()} is by far the most common back hook, mainly because of plurals and verb forms. Front hooks are spread more evenly across letters.</p>
<!--@slot mid-article-->
<h2>Hooks in play</h2>
<p>Imagine ${code("rate")} is on the board and you hold an S. Playing a word down through the square after ${code("rate")} makes ${code("rates")} as well as your new word, and you score both. Placing words alongside each other works the same way: each pair of touching letters must form a word, which is where the <a href="/guides/two-letter-words">two-letter words</a> come in.</p>
<p>Some short words take no one-letter hook at either end. In Letterpile's list that is true of ${twoNoHook.length ? ctx.list(twoNoHook, Math.min(6, twoNoHook.length)) : "no two-letter word"}${twoNoHook.length > 6 ? ` and ${twoNoHook.length - 6} more two-letter words` : ""}. Knowing which words can't be extended is just as useful, because it tells you which spots on a board are safe or blocked.</p>
<h2>Not every word takes an S</h2>
<p>It's tempting to assume any noun or verb can take an S hook, but the list is less generous than that. Of the ${fmt(three.length)} three-letter words Letterpile shows, ${fmt(noS.length)} have no S back hook in the list, for example ${ctx.list(noS.filter(w => /[aeiou]/.test(w)).slice(0, 6), 6)}. Adjectives, prepositions, interjections and words already ending in S usually can't be pluralized, and some nouns form their plurals in other ways. Before you rely on an S hook, check it.</p>
<h2>Prefixes</h2>
<p>Prefixes add meaning at the front: UN- often means “not”, RE- means “again”. Many prefixed words are a shorter word with the prefix added, but not all: plenty of words just start with the same letters. The table counts every word starting with each prefix in the list, and how many leave another word when the prefix is removed.</p>
<table>
<tr><th>Prefix</th><th>Words starting with it</th><th>Still a word without it</th></tr>
${prefixes.map(a => affixRow(a, "starts")).join("")}
</table>
<h2>Suffixes</h2>
<p>Suffixes change a word's grammar: -S and -ES make plurals, -ED and -ING make verb forms, -LY usually makes adverbs, -NESS makes nouns. They are the main reason word lists contain so many long words.</p>
<table>
<tr><th>Suffix</th><th>Words ending with it</th><th>Still a word without it</th></tr>
${suffixes.map(a => affixRow(a, "ends")).join("")}
</table>
<p>Each prefix and suffix links to its own page with a short explanation and the full list.</p>
<h2>Tips</h2>
<ul>
<li><b>Learn the S hooks of short words.</b> Most nouns and verbs take S, but not all; the exceptions are worth noticing.</li>
<li><b>Watch for words that end in a vowel.</b> They often take a back hook such as D, R, S or N.</li>
<li><b>Don't trust looks.</b> A word that seems to take a prefix may not be in the list with it. Check with the <a href="/">Word Unscrambler</a> using “use every letter”, or in your game.</li>
</ul>`,
    related: [
      { href: "/words-starting-with", label: "Words Starting With" },
      { href: "/words-ending-in", label: "Words Ending In" },
      { href: "/guides/two-letter-words", label: "Two-Letter Words" },
      { href: "/scrabble-word-finder", label: "Tile Game Word Finder" },
    ],
  };
};
