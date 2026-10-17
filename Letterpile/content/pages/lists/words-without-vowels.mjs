import { listKit } from "../../lists.mjs";
export default ctx => {
  const { byLength, words, crumbs, visible, fmt, code } = listKit(ctx);
  const none = visible.filter(w => !/[aeiou]/.test(w));
  const withY = none.filter(w => w.includes("y")), noY = none.filter(w => !w.includes("y"));
  const longest = withY.slice().sort((a, b) => b.length - a.length || (a < b ? -1 : 1))[0];
  ctx.assertWords(["rhythm", "hmm", "brr", "shh", "crypt"]);
  return {
    key: "list-novowels", path: "/lists/words-without-vowels", file: "lists/words-without-vowels.html", type: "list",
    title: "No-Vowel Words: Every Word Without A E I O U | Letterpile",
    description: `All ${fmt(none.length)} words in our list with no A, E, I, O or U: ${fmt(noY.length)} with no Y either, and ${fmt(withY.length)} that lean on Y.`,
    h1: "No-vowel words: the full list",
    crumbs: crumbs("Words without vowels", "/lists/words-without-vowels"),
    prose: `<p>These are the ${fmt(none.length)} words in our list that contain none of A, E, I, O and U. They split into two groups. The first is interjections and sounds, like ${code("hmm")} and ${code("brr")}, which have no vowel letter of any kind. The second, much larger, uses Y as its vowel: ${code("crypt")}, ${code("rhythm")} and, the longest, ${code(longest)}.</p>
<p>They're the answer to a rack full of consonants. Before you swap tiles, check whether your letters spell one of these.</p>
<h2>No vowels and no Y <span class="count">${fmt(noY.length)}</span></h2>
${words(noY)}
<h2>Words that use Y as their only vowel</h2>
${byLength(withY)}
<p>The <a href="/guides/words-without-vowels">guide to words without vowels</a> explains where these words come from and how to spot them during a game.</p>`,
    faq: [
      { q: "What's the longest word with no vowels?", a: `In our list, ${longest.toUpperCase()}, which uses Y as its vowel.` },
      { q: "Do words with no vowel letters at all exist?", a: `Yes, ${fmt(noY.length)} in our list, mostly sounds and interjections such as HMM, BRR and SHH.` },
      { q: "Is Y a vowel?", a: "Sometimes. In words like CRYPT and RHYTHM, Y makes the vowel sound, so these words have a vowel sound but no vowel letter." },
      { q: "Are these words accepted in games?", a: "Most tile-game dictionaries include the Y words; the interjections vary by dictionary. These come from ENABLE." },
    ],
    related: [{ href: "/guides/words-without-vowels", label: "Words without vowels guide" }, { href: "/guides/rack-balance", label: "Rack balance" }, { href: "/lists/two-and-three-letter-words", label: "Two- and three-letter words" }, { href: "/", label: "Word Unscrambler" }],
  };
};
