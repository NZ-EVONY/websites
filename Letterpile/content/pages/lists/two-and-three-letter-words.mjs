import { listKit } from "../../lists.mjs";
export default ctx => {
  const { words, crumbs, visible, fmt, code, common } = listKit(ctx);
  const two = visible.filter(w => w.length === 2), three = visible.filter(w => w.length === 3);
  const threeCommon = three.filter(common), threeRare = three.filter(w => !common(w));
  ctx.assertWords(["aa", "the", "cat"]);
  ctx.assertNotWords(["qi", "za"]);
  return {
    key: "list-short", path: "/lists/two-and-three-letter-words", file: "lists/two-and-three-letter-words.html", type: "list",
    title: "Two- and Three-Letter Words: Full Lists | Letterpile",
    description: `All ${fmt(two.length)} two-letter words in our list, and all ${fmt(three.length)} three-letter words with the ${fmt(threeCommon.length)} everyday ones first.`,
    h1: "Two- and three-letter words",
    crumbs: crumbs("Two- and three-letter words", "/lists/two-and-three-letter-words"),
    prose: `<p>Short words win games. They fill awkward gaps, let you lay a word alongside another so that several little words score at once, and get rid of a difficult letter for a few points instead of none. Strong players learn every two-letter word and most three-letter words by heart. Here are both lists in full: ${fmt(two.length)} two-letter words, from ${code(two[0])} to ${code(two.at(-1))}, and ${fmt(three.length)} three-letter words, split into everyday words and the rest.</p>
<h2>How players learn them</h2>
<ul>
<li><b>Two-letter words first.</b> There are few enough to learn in a week. Group them by letter: the ones with X or J are worth memorizing first.</li>
<li><b>Then the strange three-letter words.</b> You already know the everyday ones. The rare words in the second list are the ones that catch opponents out.</li>
<li><b>Practice with hooks.</b> Many three-letter words are a two-letter word plus one letter; learning them together doubles the payoff.</li>
</ul>
<h2>All two-letter words <span class="count">${fmt(two.length)}</span></h2>
${words(two)}
<h2>Everyday three-letter words <span class="count">${fmt(threeCommon.length)}</span></h2>
${words(threeCommon)}
<h2>Less common three-letter words <span class="count">${fmt(threeRare.length)}</span></h2>
${words(threeRare)}
<p>For what each two-letter word means, and how they're used, see the <a href="/guides/two-letter-words">two-letter words guide</a>.</p>`,
    faq: [
      { q: "How many two-letter words are there?", a: `${fmt(two.length)} in our list (ENABLE, without the hidden words). Other dictionaries have a few more or fewer.` },
      { q: "Why are QI and ZA missing?", a: "Some games accept them, but they aren't in the ENABLE list this site uses. Each game picks its own dictionary." },
      { q: "What makes a three-letter word everyday?", a: "It's on a list of common English words (SCOWL, sizes 10 to 35)." },
      { q: "Are one-letter words included?", a: "No. Word games need at least two letters, and ENABLE starts at two." },
    ],
    related: [{ href: "/guides/two-letter-words", label: "Two-letter words guide" }, { href: "/lists/high-scoring-short-words", label: "High-scoring short words" }, { href: "/words-by-length/3-letter-words", label: "3-letter words" }, { href: "/guides/hooks-prefixes-and-suffixes", label: "Hooks, prefixes and suffixes" }],
  };
};
