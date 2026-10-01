// Guide: every two-letter word in the shipped list, with short glosses written for this
// site. Words whose meaning we are not certain of get a neutral label (see docs/UNVERIFIED.md).
const GLOSS = {
  aa: "rough, blocky lava", ab: "an abdominal muscle (informal)", ad: "an advertisement", ae: "one (Scots)",
  ag: "agriculture (informal, as in “ag school”)", ah: "interjection of surprise or relief", ai: "a three-toed sloth", al: "noun",
  am: "a form of “be”", an: "the article before a vowel sound", ar: "the letter R", as: "conjunction and adverb",
  at: "preposition", aw: "interjection of sympathy or mild disappointment", ax: "a chopping tool (axe)", ay: "yes (also “aye”)",
  ba: "in ancient Egyptian belief, the soul", be: "to exist", bi: "informal short form of bisexual", bo: "pal, buddy (informal)",
  by: "preposition", de: "preposition used in names", do: "to perform; also the first note of the scale", ed: "education (informal)",
  ef: "the letter F", eh: "interjection asking for agreement or repetition", el: "an elevated railroad; the letter L", em: "the letter M; a printer's measure",
  en: "the letter N; half an em", er: "interjection of hesitation", es: "the letter S", et: "verb (dialect)",
  ex: "a former partner; the letter X", fa: "the fourth note of the scale", go: "to move; also a board game", ha: "interjection of surprise or triumph",
  he: "pronoun", hi: "greeting", hm: "interjection of thought", ho: "interjection to attract attention",
  id: "in psychology, the instinctive part of the mind", if: "conjunction", in: "preposition", is: "a form of “be”",
  it: "pronoun", jo: "sweetheart (Scots)", ka: "in ancient Egyptian belief, a spiritual double", la: "the sixth note of the scale",
  li: "a Chinese unit of distance", lo: "interjection meaning “look”", ma: "mother (informal)", me: "pronoun",
  mi: "the third note of the scale", mm: "interjection of agreement or enjoyment", mo: "a moment (informal)", mu: "the Greek letter M",
  my: "possessive", na: "no, not (dialect)", ne: "adjective used with names", no: "negative",
  nu: "the Greek letter N", od: "noun", oe: "noun", of: "preposition",
  oh: "interjection", om: "a sound chanted in meditation", on: "preposition", op: "op art (optical art)",
  or: "conjunction", os: "a bone", ow: "interjection of pain", ox: "a bovine animal used for work",
  oy: "interjection of dismay", pa: "father (informal)", pe: "a letter of the Hebrew alphabet", pi: "the Greek letter P; the circle ratio",
  re: "the second note of the scale", sh: "interjection asking for quiet", si: "an old name for the seventh note of the scale", so: "adverb and conjunction",
  ta: "thank you (informal)", ti: "the seventh note of the scale", to: "preposition", uh: "interjection of hesitation",
  um: "interjection of hesitation", un: "pronoun (dialect)", up: "adverb and preposition", us: "pronoun",
  ut: "an old name for the first note of the scale", we: "pronoun", wo: "noun (variant spelling)", xi: "the Greek letter X",
  xu: "a former Vietnamese coin", ya: "you (informal)", ye: "you (old plural form)", yo: "interjection used as a greeting",
};

export default ctx => {
  const { code, fmt } = ctx;
  const two = ctx.clean.filter(w => w.length === 2);
  for (const w of two) if (!GLOSS[w]) throw new Error(`two-letter-words guide: no gloss for "${w}"`);
  for (const w of Object.keys(GLOSS)) if (!two.includes(w)) throw new Error(`two-letter-words guide: "${w}" is glossed but not in the list`);
  ctx.assertNotWords(["qi", "za", "ok", "ew"]);
  const byFirst = {};
  for (const w of two) (byFirst[w[0]] ||= []).push(w);
  const ranking = Object.entries(byFirst).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const top = ranking[0];
  const ties = ranking.filter(r => r[1].length === top[1].length).map(r => r[0].toUpperCase());
  const vowelStart = two.filter(w => "aeiou".includes(w[0])).length;
  const noVowel = two.filter(w => !/[aeiou]/.test(w));
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");
  const missingFirst = letters.filter(l => !byFirst[l]).map(l => l.toUpperCase());
  const used = new Set(two.join(""));
  const neverUsed = letters.filter(l => !used.has(l)).map(l => l.toUpperCase());
  const hi = two.map(w => [w, ctx.Engine.score(w)]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6);
  return {
    key: "guide-two", path: "/guides/two-letter-words", file: "guides/two-letter-words.html", type: "guide",
    published: "2026-10-01",
    title: "Two-Letter Words: The Full List With Meanings | Letterpile",
    description: "Every two-letter word in the open ENABLE word list, with short meanings, and why games accept different lists.",
    h1: "Two-Letter Words: The Full List",
    prose: `<p class="summary">The open ENABLE word list that Letterpile uses has <b>${fmt(two.length)}</b> two-letter words. They are listed below by first letter, each with a short note on what it means. Different games accept different two-letter words, so treat this as the list for this site, not a rule for every game. ${ctx.WORDLIST_NOTE}</p>
<!--@slot after-intro-->
<h2>Why two-letter words matter</h2>
<p>In crossword-style tile games, long words get the attention, but two-letter words do much of the work. They let you place a word alongside another one, forming several short words at once, and they let a single high-value tile touch a bonus square without needing a long word around it. Because there are only ${fmt(two.length)} of them here, learning them is one of the quickest ways to find more places to play.</p>
<h2>The full list</h2>
<p>Meanings are short notes written for this site, not dictionary definitions. Where a word's meaning is obscure or we couldn't confirm it, only its part of speech is given; look those up in a dictionary if you're curious.</p>
${Object.keys(byFirst).sort().map(l => `<h3>Starting with ${l.toUpperCase()} <span class="count">${byFirst[l].length}</span></h3>
<ul>${byFirst[l].map(w => `<li>${code(w)}: ${GLOSS[w]}</li>`).join("")}</ul>`).join("\n")}
<!--@slot mid-article-->
<h2>Patterns in the list</h2>
<ul>
<li>${ties.length > 1 ? `${ties.join(" and ")} each start ${top[1].length} two-letter words, more than any other letter.` : `${top[0].toUpperCase()} starts the most two-letter words (${top[1].length}).`}</li>
<li>${fmt(vowelStart)} of the ${fmt(two.length)} start with a vowel, which is why vowels are easy to place next to other words.</li>
<li>${noVowel.length ? `${fmt(noVowel.length)} have no A, E, I, O or U: ${ctx.list(noVowel, noVowel.length)}.` : "Every one contains a vowel."}</li>
<li>No two-letter word in this list starts with ${missingFirst.join(", ")}.${neverUsed.length ? ` The letter${neverUsed.length > 1 ? "s" : ""} ${neverUsed.join(", ")} ${neverUsed.length > 1 ? "do" : "does"} not appear in any of them.` : ""}</li>
<li>Using commonly used tile values, the highest-scoring two-letter words are ${hi.map(([w, s]) => `${code(w)} (${s})`).join(", ")}.</li>
</ul>
<h2>Words this list does not have</h2>
<p>Returning visitors may notice that some familiar short words are gone. Until recently Letterpile used a different, larger list with 124 two-letter words; it was replaced by ENABLE, which has a clear public-domain release. Some games accept ${code("qi")} and ${code("za")}, and casual speech uses ${code("ok")} and ${code("ew")}, but none of those four is in the list this site uses. If your game accepts them, use them there; they just won't appear in Letterpile's results.</p>
<p>That difference is normal. Word games each choose a dictionary, and those dictionaries disagree most about short, informal and borrowed words. <a href="/guides/word-lists-explained">Word Lists Explained</a> covers why.</p>
<h2>How to learn them</h2>
<ol>
<li><b>Start with the ones you already know.</b> Most of the list is everyday English: pronouns, prepositions and interjections. Cross those off first.</li>
<li><b>Learn the unusual ones in groups.</b> Musical notes (${ctx.list(["do", "re", "mi", "fa", "la", "ti"], 6)}), letter names (${ctx.list(["ar", "ef", "el", "em", "en", "es"], 6)}) and Greek letters (${ctx.list(["mu", "nu", "xi", "pi"], 4)}) are easier to remember together.</li>
<li><b>Practice hooks.</b> For each letter, ask which two-letter words it can start or end. The <a href="/guides/hooks-prefixes-and-suffixes">hooks guide</a> explains why that helps.</li>
<li><b>Check with a tool.</b> Typing two letters into the <a href="/">Word Unscrambler</a> with “use every letter” on tells you instantly whether they form a word in this list.</li>
</ol>`,
    related: [
      { href: "/words-by-length/2-letter-words", label: "2-letter words (word list page)" },
      { href: "/guides/high-value-letters-j-q-x-z", label: "Using J, Q, X and Z" },
      { href: "/guides/hooks-prefixes-and-suffixes", label: "Hooks, Prefixes and Suffixes" },
      { href: "/scrabble-word-finder", label: "Tile Game Word Finder" },
    ],
  };
};
