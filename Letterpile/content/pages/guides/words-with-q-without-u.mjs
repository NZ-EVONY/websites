// Guide: every word in the shipped list with a Q and no U. Glosses only where we are confident.
const GLOSS = {
  qaid: "a Muslim leader or chief; also spelled caid", qanat: "an underground channel that carries water, used in dry regions",
  qat: "a shrub whose leaves are chewed as a stimulant; also spelled khat", qindar: "a former small unit of Albanian currency (also qintar)",
  qintar: "a former small unit of Albanian currency (also qindar)", qoph: "a letter of the Hebrew alphabet",
  faqir: "a Muslim or Hindu religious ascetic; also spelled fakir", qwerty: "the standard keyboard layout, named after its first six letters",
  sheqel: "the currency unit of Israel (also shekel)", sheqalim: "a plural of sheqel", tranq: "a tranquilizer (informal)",
};
export default ctx => {
  const { code, fmt } = ctx;
  const q = ctx.clean.filter(w => w.includes("q") && !w.includes("u"));
  const qAll = ctx.clean.filter(w => w.includes("q"));
  const qu = qAll.filter(w => w.includes("qu"));
  // Group words under their base form (plurals and inflections next to the base).
  const startQu = qAll.filter(w => w.startsWith("qu")).length;
  const bases = q.filter(w => !q.some(b => b !== w && w.startsWith(b) && w.length - b.length <= 2));
  const groups = bases.map(b => [b, q.filter(w => w !== b && w.startsWith(b) && !bases.some(o => o !== b && o.length > b.length && w.startsWith(o)))]);
  const covered = new Set(groups.flat(2));
  const strays = q.filter(w => !covered.has(w));
  const shortest = q.filter(w => w.length === Math.min(...q.map(x => x.length)));
  return {
    key: "guide-qnou", path: "/guides/words-with-q-without-u", file: "guides/words-with-q-without-u.html", type: "guide",
    published: "2026-10-01",
    title: "Words With Q and No U: The Full List | Letterpile",
    description: "Every word in the open ENABLE list that has a Q but no U, with notes on how to use them.",
    h1: "Words With Q and No U",
    prose: `<p class="summary">In English, Q is almost always followed by U. Of the ${fmt(qAll.length)} words with a Q in the open ENABLE word list that Letterpile shows, ${fmt(qu.length)} contain the pair QU. Only <b>${fmt(q.length)}</b> words have a Q and no U at all, and most of them are borrowings from Arabic, Hebrew, Albanian and other languages written in a different alphabet. Here is the complete list, with what each one means and how it can help in a word game. ${ctx.WORDLIST_NOTE}</p>
<!--@slot after-intro-->
<h2>The complete list</h2>
<p>Related forms (plurals and variants) are shown next to their base word.</p>
<table>
<tr><th>Word</th><th>Other forms in the list</th><th>Meaning</th></tr>
${groups.map(([b, forms]) => `<tr><td>${code(b)}</td><td>${forms.length ? forms.map(code).join(", ") : "–"}</td><td>${GLOSS[b] || "see a dictionary"}</td></tr>`).join("")}
${strays.map(w => `<tr><td>${code(w)}</td><td>–</td><td>${GLOSS[w] || "see a dictionary"}</td></tr>`).join("")}
</table>
<p>The shortest ${shortest.length > 1 ? "are" : "is"} ${ctx.list(shortest, 3)}, at ${shortest[0].length} letters. Several entries are alternative spellings of words more often written another way (for example ${code("faqir")} for fakir and ${code("qat")} for khat). These spellings come from transliteration: when a word is brought into English from a language with a different alphabet, its letters can be written in more than one way.</p>
<!--@slot mid-article-->
<h2>Why Q usually needs a U</h2>
<p>English inherited the QU spelling from Latin and French, where it stood for a “kw” sound, as in ${code("queen")} and ${code("quick")}. Native English words that have the “kw” sound were mostly respelled with QU after the Norman Conquest. So nearly every Q in an English word sits in front of a U, and the exceptions are words that came into English later, from languages where a Q-like letter stands for a different sound.</p>
<h2>Q words in general</h2>
<p>To put the short list in context, here is how all ${fmt(qAll.length)} Q words in the list break down:</p>
<table>
<tr><th>Group</th><th>Words</th></tr>
<tr><td>Start with QU</td><td>${fmt(startQu)}</td></tr>
<tr><td>Contain QU later in the word</td><td>${fmt(qu.length - startQu)}</td></tr>
<tr><td>Contain a Q and a U, but never as QU</td><td>${fmt(qAll.length - qu.length - q.length)}</td></tr>
<tr><td>Contain a Q and no U at all</td><td>${fmt(q.length)}</td></tr>
</table>
<p>The pattern is overwhelming: Q is followed by U in nearly every case. That makes a lone Q a real problem in tile games, and it explains why the few exceptions are worth knowing by heart. The words on this page are short enough to learn in one sitting, and several of them are related forms of the same few base words.</p>
<h2>Using these words in games</h2>
<ul>
<li><b>Learn the short ones first.</b> Three- and four-letter Q words without a U are the most likely to fit on a board. Check that your game's dictionary has them before relying on them.</li>
<li><b>Plurals add options.</b> Several of these words have S forms in the list, so a Q word can sometimes be extended later.</li>
<li><b>Don't hold Q forever.</b> Q is worth many points in most tile games, but a Q you can't play costs you turns. If none of these words fits and you have no U, swapping it may be the better choice.</li>
<li><b>Look for a U on the board.</b> Many more words open up if there is a U in a usable spot. The <a href="/scrabble-word-finder">tile game word finder</a> lets you add board letters to your rack search.</li>
</ul>
<h2>How to remember them</h2>
<p>A short list like this is easiest to learn by grouping. Start with the base words, ignoring plurals: there are only ${fmt(groups.length)} of them. Then sort them by where they come from or what they name: currencies (${code("qindar")}, ${code("qintar")}, ${code("sheqel")}), people and titles (${code("qaid")}, ${code("faqir")}), things and places (${code("qanat")}, ${code("qat")}), a letter (${code("qoph")}), and two modern words (${code("qwerty")}, ${code("tranq")}). Once the bases are familiar, the plural forms follow, and the table above shows which plurals the list accepts.</p>
<p>It also helps to notice that several of these words have more familiar spellings elsewhere, such as khat and fakir. If you already know the meaning, the Q spelling is just an alternative way of writing the same word, so there is less new to learn than the strange spellings suggest.</p>
<h2>Different games, different lists</h2>
<p>Some game dictionaries include more Q-without-U words than ENABLE does, and some fewer. A common example is ${code("qi")}, which some games accept but which is not in the list this site uses. The <a href="/guides/word-lists-explained">Word Lists Explained</a> guide covers why lists differ.</p>`,
    related: [
      { href: "/guides/high-value-letters-j-q-x-z", label: "Using J, Q, X and Z" },
      { href: "/words-starting-with/q", label: "Words starting with Q" },
      { href: "/guides/two-letter-words", label: "Two-Letter Words" },
      { href: "/scrabble-word-finder", label: "Tile Game Word Finder" },
    ],
  };
};
