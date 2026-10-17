import { listKit } from "../../lists.mjs";
export default ctx => {
  const { byLength, words, crumbs, visible, fmt, code, common } = listKit(ctx);
  const x = visible.filter(w => w.includes("x"));
  const short = x.filter(w => w.length <= 7), longCommon = x.filter(w => w.length > 7 && common(w));
  const two = x.filter(w => w.length === 2);
  const v = ctx.Engine.SCHEMES;
  ctx.assertWords(["ax", "ex", "ox", "xi", "xu"]);
  return {
    key: "list-x", path: "/lists/words-with-x", file: "lists/words-with-x.html", type: "list",
    title: "Words With X: Short and Common X Words | Letterpile",
    description: `Every word with X of up to seven letters (${fmt(short.length)}) and ${fmt(longCommon.length)} everyday longer X words, grouped by length, from our word list.`,
    h1: "Words with X",
    crumbs: crumbs("Words with X", "/lists/words-with-x"),
    prose: `<p>X is the friendliest of the high-value letters. It's worth ${v.scrabble.values.x} with the common tile values (${v.wwf.values.x} in Words With Friends), and it forms ${fmt(two.length)} two-letter words: ${ctx.list(two, two.length)}. That makes it easy to place on a triple letter square so that it scores in two directions at once.</p>
<p>Our list has ${fmt(x.length)} words containing an X. This page shows all of them up to seven letters, then the longer X words you'd actually use in conversation.</p>
<h2>Where X earns its points</h2>
<ul>
<li><b>Two ways at once.</b> Put the X on a letter bonus where it forms ${code("ax")} one way and ${code("ex")} or ${code("ox")} the other, and the bonus counts in both words.</li>
<li><b>Prefixes.</b> EX- starts hundreds of words, so an X next to an E is a long-word opportunity.</li>
<li><b>Endings.</b> -X endings such as -AX, -EX, -IX and -OX close short words neatly.</li>
</ul>
<h2>Every X word up to seven letters</h2>
${byLength(short)}
<h2>Everyday X words of eight letters or more <span class="count">${fmt(longCommon.length)}</span></h2>
${words(longCommon)}`,
    faq: [
      { q: "Which two-letter words use X?", a: `${two.map(w => w.toUpperCase()).join(", ")}, in the ENABLE list.` },
      { q: "What does XU mean?", a: "A former coin of Vietnam. Like many short words in game lists, it's rarely used outside them." },
      { q: "Why is X easier to play than Q or Z?", a: "It forms several two-letter words with vowels, so it can almost always be placed alongside other tiles." },
      { q: "Are all X words listed?", a: `Every one of seven letters or fewer, plus the longer ones on our everyday-word list. The full count is ${fmt(x.length)}.` },
    ],
    related: [{ href: "/lists/words-with-z", label: "Words with Z" }, { href: "/lists/words-with-j", label: "Words with J" }, { href: "/lists/two-and-three-letter-words", label: "Two- and three-letter words" }, { href: "/guides/two-letter-words", label: "Two-letter words guide" }],
  };
};
