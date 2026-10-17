import { listKit } from "../../lists.mjs";
export default ctx => {
  const { byLength, words, crumbs, visible, fmt, code, common } = listKit(ctx);
  const z = visible.filter(w => w.includes("z"));
  const short = z.filter(w => w.length <= 7), longCommon = z.filter(w => w.length > 7 && common(w));
  const zz = z.filter(w => w.includes("zz") && w.length <= 6);
  const v = ctx.Engine.SCHEMES;
  ctx.assertWords(["zax", "jazz", "zoo"]);
  ctx.assertNotWords(["zen", "za"]);
  const twoZ = z.filter(w => w.length === 2);
  return {
    key: "list-z", path: "/lists/words-with-z", file: "lists/words-with-z.html", type: "list",
    title: "Words With Z: Short and Common Z Words | Letterpile",
    description: `Every word with Z up to seven letters (${fmt(short.length)} of them) plus ${fmt(longCommon.length)} everyday longer ones, grouped by length, from our word list.`,
    h1: "Words with Z",
    crumbs: crumbs("Words with Z", "/lists/words-with-z"),
    prose: `<p>Z scores ${v.scrabble.values.z} with the usual tile values and ${v.wwf.values.z} in Words With Friends, and unlike Q it needs no partner letter, so it fits into far more words. Our list has ${fmt(z.length)} words containing at least one Z. Most of the long ones are technical terms nobody plays, so this page lists every Z word of seven letters or fewer, then the longer Z words that are in everyday use.</p>
<h2>Getting the most from a Z</h2>
<ul>
<li><b>Short is strong.</b> Three-letter words like ${code("zax")} and ${code("zoo")} let you put a Z on a letter or word bonus square without opening the board. (${code("za")}, slang for pizza, is accepted by some games but isn't in our list.)</li>
<li><b>Double Z words</b> such as ${code("jazz")} need two Z tiles or a blank; there are ${fmt(zz.length)} of six letters or fewer, listed below.</li>
<li><b>Endings help:</b> -IZE and -IZED turn many common verbs into Z words, which is why the 7-letter group is so long.</li>
</ul>
<h2>Z words of six letters or fewer with a double Z <span class="count">${fmt(zz.length)}</span></h2>
${words(zz)}
<h2>Every Z word up to seven letters</h2>
${byLength(short)}
<h2>Everyday Z words of eight letters or more <span class="count">${fmt(longCommon.length)}</span></h2>
${words(longCommon)}`,
    faq: [
      { q: "What is the shortest Z word?", a: twoZ.length ? `The two-letter ones: ${twoZ.map(w => w.toUpperCase()).join(", ")}.` : `Our list has no two-letter Z word, so the shortest have three letters, like ZAX and ZOO. ZA is accepted by some games but isn't in ENABLE.` },
      { q: "Why aren't all the long Z words listed?", a: `There are ${fmt(z.length)} in total, mostly rare technical words. This page keeps the ones of seven letters or fewer and the everyday longer ones.` },
      { q: "Which letters go well with Z?", a: "Vowels most of all, and endings like -IZE and -IZED. ZO, ZA and ZE combinations start many short words." },
      { q: "Is ZEN a valid word?", a: "Not in the ENABLE list, which leaves out most words usually written with a capital letter." },
    ],
    related: [{ href: "/lists/words-with-q", label: "Words with Q" }, { href: "/lists/words-with-x", label: "Words with X" }, { href: "/lists/high-scoring-short-words", label: "High-scoring short words" }, { href: "/guides/high-value-letters-j-q-x-z", label: "High-value letters" }],
  };
};
