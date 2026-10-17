import { listKit } from "../../lists.mjs";
export default ctx => {
  const { byLength, crumbs, visible, fmt, code } = listKit(ctx);
  const j = visible.filter(w => w.includes("j"));
  const two = j.filter(w => w.length === 2), three = j.filter(w => w.length === 3);
  const v = ctx.Engine.SCHEMES;
  ctx.assertWords(["jo", "jab", "jaw", "jot", "joy", "jut"]);
  return {
    key: "list-j", path: "/lists/words-with-j", file: "lists/words-with-j.html", type: "list",
    title: "Words With J: Every J Word by Length | Letterpile",
    description: `All ${fmt(j.length)} words with a J in our word list, grouped by length, with the ${fmt(two.length + three.length)} two- and three-letter J words first.`,
    h1: "Words with J",
    crumbs: crumbs("Words with J", "/lists/words-with-j"),
    prose: `<p>J is a heavy tile: ${v.scrabble.values.j} points with the common values and ${v.wwf.values.j} in Words With Friends. It rarely appears more than once in a word, it almost always sits next to a vowel, and it has just ${fmt(two.length)} two-letter word in our list, ${two.map(w => code(w)).join(", ")}. That makes the three-letter J words the workhorses: there are ${fmt(three.length)} of them, including ${code("jab")}, ${code("jaw")} and ${code("jot")}.</p>
<p>This page lists all ${fmt(j.length)} words with a J, shortest first, so the playable ones are always near the top.</p>
<h2>Playing a J well</h2>
<ul>
<li><b>Find the vowel.</b> J is followed by a vowel in almost every English word. Look for an open A, E, O or U on the board first.</li>
<li><b>Keep it for a bonus.</b> A J on a triple letter square is worth ${v.scrabble.values.j * 3} on its own.</li>
<li><b>Don't hold it too long.</b> With so few short J words, waiting for the perfect spot can cost more than playing it now.</li>
</ul>
<h2>All words with J, by length</h2>
${byLength(j)}`,
    faq: [
      { q: "Is there a two-letter word with J?", a: `${two.length === 1 ? `Yes, one: ${two[0].toUpperCase()}, a Scottish word for a sweetheart.` : `Yes: ${two.map(w => w.toUpperCase()).join(", ")}.`}` },
      { q: "Why do so few words have two J's?", a: "J came into English late, mostly through French and Latin, and it almost never doubles. Words with two J's are borrowed names and rare terms." },
      { q: "What's a good J word to remember?", a: "The three-letter ones, like JAB, JAW, JOT, JOY and JUT, because they fit almost anywhere a vowel is open." },
      { q: "Does every game accept these words?", a: "No list matches every game. These come from the open ENABLE list." },
    ],
    related: [{ href: "/lists/words-with-q", label: "Words with Q" }, { href: "/lists/words-with-x", label: "Words with X" }, { href: "/lists/high-scoring-short-words", label: "High-scoring short words" }, { href: "/guides/high-value-letters-j-q-x-z", label: "High-value letters" }],
  };
};
