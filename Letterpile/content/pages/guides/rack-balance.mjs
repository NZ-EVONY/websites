// Guide: rack balance. Advice is framed as heuristics; facts are computed from the list.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const seven = ctx.clean.filter(w => w.length === 7);
  const vc = w => [...w].filter(c => "aeiou".includes(c)).length;
  const dist = {};
  for (const w of seven) { const v = vc(w); dist[v] = (dist[v] || 0) + 1; }
  const peak = Object.entries(dist).sort((a, b) => b[1] - a[1])[0];
  const twoOrThree = (dist[2] || 0) + (dist[3] || 0);
  const pct = n => (100 * n / seven.length).toFixed(1);
  const balanced = "aeinrst";
  const heavy = "aeiioua".slice(0, 7);
  const lumpy = "bcdkmvw";
  const count = rack => Engine.unscramble(rack).length;
  const sevenFrom = rack => Engine.unscramble(rack, { exact: true }).map(x => x.word);
  const balancedSeven = sevenFrom(balanced);
  const pair = (a, b) => seven.filter(w => w.includes(a) && w.includes(b)).length;
  const withS = ctx.clean.filter(w => w.endsWith("s")).length;
  return {
    key: "guide-rack", path: "/guides/rack-balance", file: "guides/rack-balance.html", type: "guide",
    published: "2026-10-01",
    title: "Rack Balance: Keep a Good Mix of Letters | Letterpile",
    description: "What rack balance means in tile word games, how to judge vowels and consonants, and which leaves help or hurt.",
    h1: "Rack Balance Explained",
    prose: `<p class="summary">In tile games where you hold a rack of letters, the tiles you keep after a turn shape your next one. A “balanced” rack has a sensible mix of vowels and consonants, few duplicates and some flexible letters. This guide explains what balance means, shows with real counts from the word list why it helps, and offers rules of thumb. They are heuristics, not guarantees: the board and the tiles still in the bag matter too.</p>
<!--@slot after-intro-->
<h2>Vowels and consonants</h2>
<p>Most words need both. Among the ${fmt(seven.length)} seven-letter words Letterpile shows, the most common number of vowels (A, E, I, O, U) is ${peak[0]}, found in ${fmt(peak[1])} words. Words with two or three vowels make up ${pct(twoOrThree)}% of the seven-letter list. That is the practical basis for the usual advice to aim for about three vowels and four consonants on a seven-tile rack.</p>
<table>
<tr><th>Vowels in a seven-letter word</th><th>Words</th><th>Share</th></tr>
${Object.keys(dist).map(Number).sort((a, b) => a - b).map(v => `<tr><td>${v}</td><td>${fmt(dist[v])}</td><td>${pct(dist[v])}%</td></tr>`).join("")}
</table>
<p>Y works as a vowel in some words and a consonant in others, which is why it isn't counted here; treat it as a flexible extra.</p>
<h2>A worked comparison</h2>
<p>Here are three seven-tile racks run through the <a href="/">Word Unscrambler</a> on Letterpile's list. The count is every word of two letters or more the rack can spell:</p>
<table>
<tr><th>Rack</th><th>Mix</th><th>Words it can spell</th><th>Seven-letter words</th></tr>
<tr><td>${code(balanced)}</td><td>3 vowels, 4 common consonants</td><td>${fmt(count(balanced))}</td><td>${fmt(balancedSeven.length)}</td></tr>
<tr><td>${code(heavy)}</td><td>all vowels</td><td>${fmt(count(heavy))}</td><td>${fmt(sevenFrom(heavy).length)}</td></tr>
<tr><td>${code(lumpy)}</td><td>no vowels</td><td>${fmt(count(lumpy))}</td><td>${fmt(sevenFrom(lumpy).length)}</td></tr>
</table>
<p>The balanced rack ${code(balanced)} can spell ${fmt(balancedSeven.length)} seven-letter words in this list${balancedSeven.length ? `, such as ${ctx.list(balancedSeven, 3)}` : ""}. The other two can barely spell anything. Real racks are rarely that extreme, but the pattern holds: the closer you stay to a mix of common letters, the more options you have.</p>
<!--@slot mid-article-->
<h2>Why some letter pairs keep more options</h2>
<p>One way to see the value of a good leave is to count how many seven-letter words contain a given pair of letters. In Letterpile's list, ${fmt(pair("e", "r"))} seven-letter words contain both an E and an R, and ${fmt(pair("e", "s"))} contain both an E and an S. Only ${fmt(pair("u", "v"))} contain both a U and a V, and ${fmt(pair("i", "u"))} contain both an I and a U. Keeping a pair like E and R leaves many more words within reach next turn than keeping U and V.</p>
<h2>Duplicates</h2>
<p>Two of the same letter cut your options, because most words don't repeat a letter. A pair of E's is usually manageable; two U's or two V's rarely are. A common heuristic is to play off duplicates early, even for a few points less, so that your next rack has more variety.</p>
<h2>Flexible letters</h2>
<ul>
<li><b>S</b> turns many nouns into plurals and many verbs into a third-person form. In Letterpile's list ${fmt(withS)} words end in S. That makes an S valuable to keep for a turn when it earns clearly more than it would now.</li>
<li><b>Blanks</b> can be any letter. Players usually save them for a play that uses all their tiles or reaches a strong bonus square, since a blank scores nothing itself.</li>
<li><b>E, R, A, T, I, N</b> combine with almost anything. A leave (the tiles you keep) built from these is usually easy to play next turn.</li>
<li><b>Q without U, and several high-value consonants together,</b> are the classic awkward leaves. The <a href="/guides/words-with-q-without-u">Q-without-U guide</a> lists the words that help.</li>
</ul>
<h2>Rules of thumb</h2>
<ol>
<li>After choosing a play, look at what's left. If it is all vowels or all consonants, consider a slightly lower-scoring play that fixes the mix.</li>
<li>Don't keep two of a letter unless both are very common (E is the usual exception).</li>
<li>Swapping tiles costs a turn. It can still be worth it when the rack is badly out of balance and no reasonable play fixes it, but that is a judgment call, not a rule.</li>
<li>Keep a flexible letter or two (S, a blank, E, R) for the turn after, when they can turn a decent word into a long one.</li>
</ol>
<h2>A quick checklist before you play</h2>
<p>Before committing to a word, run through three questions: how many vowels will I keep, will I keep two of the same letter, and am I giving away an S or a blank for only a few points? If two of the answers are bad, look for an alternative play that scores slightly less but leaves a better rack.</p>
<h2>Where tools help, and where they don't</h2>
<p>A word finder shows what you can play now, ranked by letter score. It doesn't know the board's bonus squares or how good your leave will be. Use the <a href="/scrabble-word-finder">tile game word finder</a> to see your options, then use the ideas here to choose between them. And as always: ${ctx.WORDLIST_NOTE.charAt(0).toLowerCase() + ctx.WORDLIST_NOTE.slice(1)}</p>`,
    related: [
      { href: "/scrabble-word-finder", label: "Tile Game Word Finder" },
      { href: "/guides/letter-values-and-tile-counts", label: "Letter Values and Tile Counts" },
      { href: "/guides/words-with-q-without-u", label: "Words With Q and No U" },
      { href: "/words-by-length/7-letter-words", label: "7-letter words" },
    ],
  };
};
