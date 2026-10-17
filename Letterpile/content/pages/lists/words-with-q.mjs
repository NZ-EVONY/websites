import { listKit } from "../../lists.mjs";
export default ctx => {
  const { byLength, words, crumbs, visible, fmt, code } = listKit(ctx);
  const q = visible.filter(w => w.includes("q"));
  const noU = q.filter(w => /q(?!u)/.test(w));
  ctx.assertWords(["qat", "qats", "faqir", "qwerty", "quiz"]);
  ctx.assertNotWords(["qi"]);
  const shortest = q.filter(w => w.length === Math.min(...q.map(x => x.length)));
  if (!["qat", "faqir", "qwerty"].every(w => noU.includes(w))) throw new Error("lists/words-with-q: examples changed");
  const v = ctx.Engine.SCHEMES;
  return {
    key: "list-q", path: "/lists/words-with-q", file: "lists/words-with-q.html", type: "list",
    title: "Words With Q: Full List, With and Without U | Letterpile",
    description: `All ${fmt(q.length)} words with a Q in our word list, grouped by length, starting with the ${fmt(noU.length)} words where Q isn't followed by U.`,
    h1: "Words with Q",
    crumbs: crumbs("Words with Q", "/lists/words-with-q"),
    prose: `<p>Q is worth ${v.scrabble.values.q} points with the usual tile values, and it's the letter players most often get stuck with. This page lists every word in our list that contains a Q: ${fmt(q.length)} of them, from ${ctx.list(shortest, 3)} up to the longest. The short ones matter most during a game, so they come first, and the rare words where Q stands without a U have their own section at the top.</p>
<h2>When this list helps</h2>
<ul>
<li><b>Holding a Q without a U.</b> The ${fmt(noU.length)} words below are your only escape routes apart from swapping tiles.</li>
<li><b>Looking for a hook.</b> ${code("qat")} takes an S to make ${code("qats")}, a cheap way to add a Q word to the board.</li>
<li><b>Five-letter puzzles.</b> The 5-letter group is a quick way to check which Q words are possible when a puzzle shows a Q.</li>
</ul>
<p>For the strategy behind playing a Q, read <a href="/guides/words-with-q-without-u">Words with Q but no U</a> and <a href="/guides/high-value-letters-j-q-x-z">High-value letters</a>.</p>
<h2>Q without U <span class="count">${fmt(noU.length)}</span></h2>
${words(noU)}
<h2>All words with Q, by length</h2>
${byLength(q)}`,
    faq: [
      { q: "What is the shortest word with Q?", a: `In our list, the shortest have ${shortest[0].length} letters: ${shortest.map(w => w.toUpperCase()).join(", ")}. QI, accepted by some games, isn't in the ENABLE list.` },
      { q: "Which words use Q without U?", a: `Our list has ${fmt(noU.length)}, shown at the top of this page; QAT, FAQIR and QWERTY are among the better known.` },
      { q: "Does every game accept these words?", a: "No. This is the open ENABLE list. Tournament and app dictionaries differ, so check unusual words against your game." },
      { q: "How many points is a Q worth?", a: `${v.scrabble.values.q} with the common tile values and ${v.wwf.values.q} with Words With Friends values.` },
    ],
    related: [{ href: "/lists/words-with-z", label: "Words with Z" }, { href: "/lists/words-with-x", label: "Words with X" }, { href: "/lists/words-with-j", label: "Words with J" }, { href: "/guides/words-with-q-without-u", label: "Words with Q but no U" }],
  };
};
