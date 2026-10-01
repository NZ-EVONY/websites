// Guide: words with no A, E, I, O, U (and none with Y either). All sets computed.
const GLOSS = {
  brr: "a sound made when you feel cold (also brrr)", brrr: "a longer form of brr",
  crwth: "an old Celtic stringed instrument played with a bow", cwm: "a bowl-shaped hollow at the head of a mountain valley (a cirque)",
  hm: "a sound of thinking or doubt", hmm: "a longer form of hm", mm: "a sound of agreement or enjoyment",
  nth: "to the nth degree: the last in a series, or extremely", pfft: "a sound of dismissal", phpht: "a sound of annoyance (also pht)",
  pht: "a sound of annoyance", psst: "a sound used to get someone's attention quietly", sh: "a sound asking for quiet", shh: "a longer form of sh",
  tsk: "a clicking sound of disapproval; also a verb meaning to make that sound", tsktsk: "a doubled form of tsk",
};
export default ctx => {
  const { code, fmt } = ctx;
  const noAeiou = ctx.clean.filter(w => !/[aeiou]/.test(w));
  const noY = noAeiou.filter(w => !w.includes("y"));
  const withY = noAeiou.filter(w => w.includes("y"));
  const base = noY.filter(w => !noY.some(b => b !== w && w.startsWith(b) && w.length - b.length <= 2 && GLOSS[b]));
  const longestY = withY.filter(w => w.length === Math.max(...withY.map(x => x.length)));
  const byLen = {};
  for (const w of withY) (byLen[w.length] ||= []).push(w);
  const shortY = withY.filter(w => w.length <= 4);
  const wLetter = noY.filter(w => w.includes("w"));
  ctx.assertNotWords(["hmmm"]);
  const yc = {};
  for (const w of withY) for (const c of new Set(w)) if (c !== "y") yc[c] = (yc[c] || 0) + 1;
  const topY = Object.entries(yc).sort((a, b) => b[1] - a[1]).slice(0, 8);
  ctx.assertWords(["rhythm", "rhythms", "crypt", "lynx", "gym", "myth", "sky", "fly", "cry", "lymph"]);
  return {
    key: "guide-novowels", path: "/guides/words-without-vowels", file: "guides/words-without-vowels.html", type: "guide",
    published: "2026-10-01",
    title: "Words Without Vowels: The Complete List | Letterpile",
    description: "The words in the open ENABLE list with no a, e, i, o, u or y, with notes on what they mean.",
    h1: "Words Without Vowels",
    prose: `<p class="summary">Whether a word “has no vowels” depends on what you count as a vowel. In the open ENABLE word list that Letterpile shows, <b>${fmt(noAeiou.length)}</b> words have no A, E, I, O or U. Most of those use Y as their vowel, like ${code("rhythm")} and ${code("crypt")}. Only <b>${fmt(noY.length)}</b> words have no A, E, I, O, U <em>or</em> Y, and almost all of them are sounds rather than ordinary words. Both lists are below. ${ctx.WORDLIST_NOTE}</p>
<!--@slot after-intro-->
<h2>Words with no A, E, I, O, U or Y</h2>
<p>These ${fmt(noY.length)} words are the strictest case. Related forms (such as plurals) are shown with their base word.</p>
<table>
<tr><th>Word</th><th>Meaning</th></tr>
${noY.map(w => `<tr><td>${code(w)}</td><td>${GLOSS[w] || (noY.find(b => b !== w && w.startsWith(b) && GLOSS[b]) ? `a form of ${code(noY.find(b => b !== w && w.startsWith(b) && GLOSS[b]))}` : "see a dictionary")}</td></tr>`).join("")}
</table>
<p>Two groups stand out. Most of the list is interjections, written-down sounds such as ${code("hmm")}, ${code("shh")} and ${code("psst")}. The others, ${ctx.list(wLetter, wLetter.length)}, come from Welsh, where W is used as a vowel. ${code("nth")} is a special case: it comes from the mathematical use of n for “any number”.</p>
<h2>When Y is the vowel</h2>
<p>Y works as a vowel in many words, either on its own (${code("gym")}, ${code("myth")}) or at the end (${code("sky")}, ${code("fly")}). There are ${fmt(withY.length)} words in the list with Y but no A, E, I, O or U. The longest ${longestY.length > 1 ? "are" : "is"} ${ctx.list(longestY, 3)}, at ${longestY[0].length} letters.</p>
<table>
<tr><th>Length</th><th>Words</th><th>Examples</th></tr>
${Object.keys(byLen).map(Number).sort((a, b) => a - b).map(n => `<tr><td>${n}</td><td>${byLen[n].length}</td><td>${ctx.list(byLen[n], 4)}</td></tr>`).join("")}
</table>
<!--@slot mid-article-->
<h2>All Y-only words up to four letters</h2>
<p>Short words matter most in tile games. These ${fmt(shortY.length)} words of four letters or fewer use Y as their only vowel:</p>
<p class="wordlist">${shortY.join(" ")}</p>
<h2>Letters in Y-only words</h2>
<p>Which consonants do the Y-only words lean on? Counting how many of the ${fmt(withY.length)} words contain each letter:</p>
<table>
<tr><th>Letter</th><th>Words containing it</th></tr>
${topY.map(([c, n]) => `<tr><td>${c.toUpperCase()}</td><td>${fmt(n)}</td></tr>`).join("")}
</table>
<p>Letters that cluster easily with Y, such as the R and L of ${code("cry")} and ${code("fly")}, and the H and P of Greek-derived spellings like ${code("lymph")}, are especially common.</p>
<h2>How the counts were made</h2>
<p>Every number on this page comes from the ENABLE word list as shown on Letterpile, with hidden vulgar words left out, and is recalculated each time the site is built. “Vowel” means the letters A, E, I, O and U; Y is counted separately. A word only needs to lack those letters to be listed, whatever its pronunciation.</p>
<h2>Why these words exist</h2>
<p>English spelling usually needs a vowel letter in each syllable, so vowelless words come from a few special sources:</p>
<ul>
<li><b>Interjections</b> try to spell a sound that isn't really a syllable, such as a hiss or a hum. Writers have settled on spellings like ${code("shh")} and ${code("hmm")}, and dictionaries record the common ones.</li>
<li><b>Welsh borrowings</b> keep Welsh spelling, where W and Y can be vowels.</li>
<li><b>Y as a vowel</b> is old and regular in English spelling, especially in words from Greek (${code("rhythm")}, ${code("myth")}, ${code("lynx")}).</li>
</ul>
<h2>Interjections in word lists</h2>
<p>Interjections are an unusual corner of any word list. They are words that mostly appear in dialogue and comics, they are spelled however writers choose to spell a sound, and dictionaries only record the spellings that became common. That is why a list may include ${code("hmm")} but not a longer “hmmm”, and why different games accept different sets of them.</p>
<h2>Using them in games</h2>
<p>A rack with no vowels is hard to play. Knowing a few vowelless words gives you an option other than swapping tiles. The interjections are the most useful, because they are short and use common consonants. Check that your game's dictionary accepts them, because interjections are exactly the kind of word that differs between lists. The <a href="/">Word Unscrambler</a> will show any vowelless words in your letters, and the <a href="/guides/rack-balance">rack balance guide</a> explains how to avoid getting stuck in the first place.</p>`,
    related: [
      { href: "/guides/rack-balance", label: "Rack Balance Explained" },
      { href: "/guides/two-letter-words", label: "Two-Letter Words" },
      { href: "/guides/words-with-q-without-u", label: "Words With Q and No U" },
      { href: "/", label: "Word Unscrambler" },
    ],
  };
};
