// Guide: what an anagram is. Every example is checked letter by letter at build time.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const sig = w => [...w.replace(/ /g, "")].sort().join("");
  const check = (a, b) => { if (sig(a) !== sig(b)) throw new Error(`anagram-basics: "${a}" and "${b}" are not anagrams`); };
  const pairs = [["listen", "silent"], ["night", "thing"], ["earth", "heart"], ["below", "elbow"], ["dusty", "study"], ["save", "vase"]];
  for (const [a, b] of pairs) { check(a, b); ctx.assertWords([a, b]); }
  check("dormitory", "dirty room");
  ctx.assertPhrase("dormitory", "dirty room");
  // Largest family in the visible list.
  const map = new Map();
  for (const w of ctx.clean) { const k = sig(w); map.set(k, [...(map.get(k) || []), w]); }
  const fams = [...map.values()].filter(f => f.length > 1);
  const biggest = fams.reduce((a, b) => (b.length > a.length ? b : a));
  const sizeCount = {};
  for (const f of fams) sizeCount[f.length] = (sizeCount[f.length] || 0) + 1;
  const inFamily = fams.reduce((s, f) => s + f.length, 0);
  const pct = (100 * inFamily / ctx.clean.length).toFixed(1);
  const partial = ctx.unscramble("heart").filter(w => w.length < 5);
  return {
    key: "guide-anagram", path: "/guides/anagram-basics", file: "guides/anagram-basics.html", type: "guide",
    published: "2026-10-01",
    title: "What Is an Anagram? Examples, Types and Tricks | Letterpile",
    description: "What anagrams are, perfect versus partial anagrams, real examples, and quick tricks for spotting them.",
    h1: "What Is an Anagram?",
    prose: `<p class="summary">An anagram is a word or phrase made by rearranging all the letters of another, using each letter exactly once. ${code("listen")} and ${code("silent")} are anagrams; so are ${code("dormitory")} and ${code("dirty room")}. This guide explains the different kinds, shows real examples checked against Letterpile's word list, and gives a few tricks for finding anagrams in your head.</p>
<!--@slot after-intro-->
<h2>The rule: same letters, same counts</h2>
<p>Two words are anagrams when they have exactly the same letters the same number of times. Order doesn't matter, and in phrase anagrams spaces and punctuation are ignored. A quick test is to write both words' letters in alphabetical order: if the results match, they are anagrams. ${code("earth")} and ${code("heart")} both sort to ${code(sig("earth"))}.</p>
<table>
<tr><th>Word</th><th>Anagram</th><th>Letters in order</th></tr>
${pairs.map(([a, b]) => `<tr><td>${code(a)}</td><td>${code(b)}</td><td>${code(sig(a))}</td></tr>`).join("")}
</table>
<h2>Perfect and partial anagrams</h2>
<p>A <b>perfect</b> (or full) anagram uses every letter. That is what most people mean by the word, and it's what Letterpile's <a href="/anagram-solver">Anagram Solver</a> finds.</p>
<p>A <b>partial</b> anagram, sometimes called a subanagram, uses only some of the letters. The letters of ${code("heart")} contain ${fmt(partial.length)} shorter words in the list, such as ${ctx.list(partial.filter(w => w.length === 4), 4)}. Finding those is the job of a word unscrambler, like the <a href="/">Word Unscrambler</a>, rather than an anagram solver.</p>
<h2>Single-word and phrase anagrams</h2>
<p>Single-word anagrams swap one word for another. Phrase anagrams rearrange letters across word boundaries, like ${code("dormitory")} into ${code("dirty room")}. Phrase anagrams are popular in puzzles because a phrase gives far more possible arrangements, and the best ones relate in meaning to the original. Letterpile's solver can find two-word anagrams; longer phrases need more human judgment.</p>
<!--@slot mid-article-->
<h2>How common are anagrams?</h2>
<p>More common than you might think. In Letterpile's list, ${fmt(fams.length)} sets of letters spell two or more words, covering ${fmt(inFamily)} words in total (about ${pct}% of the list). Most sets are pairs, but some are large:</p>
<table>
<tr><th>Words in the set</th><th>How many sets</th></tr>
${Object.keys(sizeCount).map(Number).sort((a, b) => a - b).map(n => `<tr><td>${n}</td><td>${fmt(sizeCount[n])}</td></tr>`).join("")}
</table>
<p>The largest set has ${biggest.length} words, all spelled from the letters ${code(sig(biggest[0]))}: ${ctx.list(biggest, biggest.length)}. Many of those are uncommon words, which is typical: big anagram sets usually include obscure entries.</p>
<h2>Anagrams in word games</h2>
<p>Many word games are anagram games in disguise. A rack of tiles is a set of letters waiting to be rearranged; a jumble asks for the one arrangement that's a word; letter-wheel games ask for every partial anagram of the wheel. That is why experienced players learn letter sets rather than single words: once you know that a set such as ${code(sig(biggest[0]))} spells several words, you can pick whichever one fits the board. The seven letters ${code("aeinrst")}, for example, spell ${ctx.list(map.get("aeinrst") || [], (map.get("aeinrst") || []).length)} in this list, and they are made almost entirely of 1-point letters, which is why such sets come up so often.</p>
<h2>Mistakes to avoid</h2>
<ul>
<li><b>Losing count of repeated letters.</b> ${code("listen")} and ${code("silent")} each have one of every letter, but many words don't. Two E's in one word need two E's in the other.</li>
<li><b>Changing a plural.</b> Adding or removing an S changes the letter set, so a plural and a singular are never anagrams of each other.</li>
<li><b>Expecting a link in meaning.</b> Most anagram pairs are coincidences. The ones that seem to comment on each other are memorable precisely because they're rare.</li>
</ul>
<h2>Tricks for spotting anagrams</h2>
<ol>
<li><b>Pull out common chunks.</b> Look for endings like -ING, -ED, -ER or -ES and set them aside; the rest is shorter and easier.</li>
<li><b>Try consonant pairs.</b> Groups such as TH, CH, ST and TR often start or end words.</li>
<li><b>Alternate vowels and consonants.</b> Writing the letters in a circle, or shuffling them, breaks the hold of the order you first saw. Letterpile's <a href="/text-twist-solver">Text Twist solver</a> has a Twist button for exactly this.</li>
<li><b>Check with signatures.</b> If you think you have one, sort both sets of letters and compare.</li>
</ol>
<h2>Checking an anagram by hand</h2>
<p>Without a tool, the fastest reliable check is to cross letters off. Write the first word, then go through the second word letter by letter, crossing off one matching letter in the first each time. If every letter is crossed off exactly once and nothing is left over, the two are anagrams. It takes a few seconds and catches the usual slip, a repeated letter counted once.</p>
<h2>Where anagrams turn up</h2>
<p>Cryptic crossword clues often hide an anagram signaled by a word like “confused” or “broken”. Newspaper jumbles are anagram puzzles. Some games ask for every word in a set of letters, which is anagram-finding with partial anagrams allowed. And many people just enjoy them: a good anagram that matches its original in meaning is a small piece of wordplay. ${ctx.WORDLIST_NOTE}</p>`,
    related: [
      { href: "/anagram-solver", label: "Anagram Solver" },
      { href: "/jumble-solver", label: "Jumble Solver" },
      { href: "/guides/how-word-unscramblers-work", label: "How Word Unscramblers Work" },
      { href: "/", label: "Word Unscrambler" },
    ],
  };
};
