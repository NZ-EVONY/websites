// Guide: J, Q, X and Z. Counts and shortest words computed from the shipped list.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const L = ["j", "q", "x", "z"];
  const info = L.map(l => {
    const ws = ctx.clean.filter(w => w.includes(l));
    const min = Math.min(...ws.map(w => w.length));
    const shortest = ws.filter(w => w.length === min);
    const three = ws.filter(w => w.length === 3);
    const four = ws.filter(w => w.length === 4);
    const start = ws.filter(w => w[0] === l).length;
    return { l, ws, min, shortest, three, four, start, value: Engine.SCHEMES.scrabble.values[l] };
  });
  const pct = n => (100 * n / ctx.clean.length).toFixed(1);
  const two = ctx.clean.filter(w => w.length === 2 && /[jqxz]/.test(w));
  const both = ctx.clean.filter(w => /[jqxz].*[jqxz]/.test(w) && new Set(w.match(/[jqxz]/g)).size > 1);
  const zRack = "zaertio", sRack = "saertio";
  const zPlays = Engine.findPlays(zRack), sPlays = Engine.findPlays(sRack);
  const xzVowelHooks = ["ax", "ex", "ox", "xi", "xu"].filter(w => ctx.cleanSet.has(w));
  return {
    key: "guide-jqxz", path: "/guides/high-value-letters-j-q-x-z", file: "guides/high-value-letters-j-q-x-z.html", type: "guide",
    published: "2026-10-01",
    title: "Using J, Q, X and Z in Word Games | Letterpile",
    description: "Why J, Q, X and Z are worth keeping, how many words contain them, and short words that make them easy to play.",
    h1: "Using J, Q, X and Z",
    prose: `<p class="summary">J, Q, X and Z are the rare, high-value letters of English tile games. Each appears in only a small share of words, which is why they score so much and why they can get stuck on your rack. This guide counts how many words in Letterpile's list contain each one, lists the short words that make them easier to play, and gives practical tips. ${ctx.WORDLIST_NOTE}</p>
<!--@slot after-intro-->
<h2>How rare are they?</h2>
<table>
<tr><th>Letter</th><th>Common value</th><th>Words containing it</th><th>Share of the list</th><th>Words starting with it</th></tr>
${info.map(i => `<tr><td>${i.l.toUpperCase()}</td><td>${i.value}</td><td>${fmt(i.ws.length)}</td><td>${pct(i.ws.length)}%</td><td>${fmt(i.start)}</td></tr>`).join("")}
</table>
<p>For comparison, the list has ${fmt(ctx.clean.length)} words in total. Each of these letters appears in only a few percent of them. ${fmt(both.length)} words contain two different letters from the four.</p>
<h2>The shortest words with each letter</h2>
<ul>
${info.map(i => `<li><b>${i.l.toUpperCase()}</b>: the shortest ${i.shortest.length > 1 ? "words are" : "word is"} ${ctx.list(i.shortest, i.shortest.length)} (${i.min} letters).</li>`).join("\n")}
</ul>
<p>Two-letter words with these letters are especially useful because they can be squeezed in almost anywhere. In this list they are ${ctx.list(two, two.length)}. ${xzVowelHooks.length ? `X pairs with several vowels: ${ctx.list(xzVowelHooks, xzVowelHooks.length)}.` : ""} There is no two-letter word with Q or Z in the list this site uses.</p>
<!--@slot mid-article-->
<h2>Three-letter words</h2>
${info.map(i => `<h3>With ${i.l.toUpperCase()} <span class="count">${i.three.length}</span></h3>\n<p class="wordlist">${i.three.join(" ")}</p>`).join("\n")}
<h2>Four-letter words: how many</h2>
<p>${info.map(i => `${fmt(i.four.length)} four-letter words contain ${i.l.toUpperCase()}`).join("; ")}. The <a href="/words-by-length/4-letter-words">4-letter words</a> page lists them all, and the <a href="/crossword-solver">Crossword Solver</a> can find ones that fit a pattern, such as <code>?A?Z</code>.</p>
<h2>Why these letters are rare</h2>
<p>Each of the four has its own history. J began as a variant way of writing I and was only gradually treated as a separate letter, so fewer older English words use it. Q appears almost only in the pair QU, which English took from Latin and French spelling. X often stands for the sound “ks”, which English usually spells other ways, and many X words come from Latin or Greek. Z is uncommon in native English words; a large share of Z words are borrowings or come from Greek. The counts in the table above reflect that history: these letters are rare in the word list because they were rare in the words English collected.</p>
<h2>A worked example</h2>
<p>Here is how one high-value tile changes the best plays for a rack, by base score with commonly used values. The rack ${code(zRack)} (with a Z) can make ${fmt(zPlays.length)} words; the top three are ${zPlays.slice(0, 3).map(p => `${code(p.word)} (${p.score})`).join(", ")}. Swap the Z for an S, giving ${code(sRack)}, and the top three become ${sPlays.slice(0, 3).map(p => `${code(p.word)} (${p.score})`).join(", ")}. The Z rack has fewer words, but the ones it has score more, which is the trade-off these letters always bring.</p>
<h2>Tips</h2>
<ul>
<li><b>Aim for bonus squares.</b> A high-value letter on a letter-multiplier square, ideally forming two words at once, is often worth more than a long word.</li>
<li><b>Keep a vowel nearby.</b> J, X and Z combine easily with vowels; ${ctx.list(info[2].three.filter(w => /^[aeiou]x|x[aeiou]$/.test(w)).slice(0, 4), 4)} are short X words built around a vowel.</li>
<li><b>Q needs planning.</b> Most Q words need a U. The <a href="/guides/words-with-q-without-u">Q without U list</a> is short enough to learn.</li>
<li><b>Don't hold one too long.</b> A high-value tile that can't be played costs points every turn you keep it. If no play is likely soon, consider using it for fewer points or swapping.</li>
</ul>
<h2>Holding or playing: a simple test</h2>
<p>When you have one of these letters and no strong play, ask two questions. First, is there a vowel-rich spot on the board where a short word with the letter could touch a bonus square next turn? If so, holding it for one turn can pay. Second, how many of your other tiles would you have to keep alongside it? If holding the letter means also keeping awkward tiles, the cost grows quickly, and a lower-scoring play that uses it now is often the better choice. These are rules of thumb; the board in front of you decides.</p>
<p>The <a href="/scrabble-word-finder">tile game word finder</a> helps with the first question: add a board letter, and it shows only words that pass through it.</p>
<h2>Values differ by game</h2>
<p>The values above are the ones commonly used in Scrabble-style games. Words With Friends is commonly reported to value J at 10, Q at 10, X at 8 and Z at 10. See <a href="/guides/letter-values-and-tile-counts">Letter Values and Tile Counts</a> for both tables.</p>`,
    related: [
      { href: "/guides/words-with-q-without-u", label: "Words With Q and No U" },
      { href: "/guides/letter-values-and-tile-counts", label: "Letter Values and Tile Counts" },
      { href: "/guides/two-letter-words", label: "Two-Letter Words" },
      { href: "/scrabble-word-finder", label: "Tile Game Word Finder" },
    ],
  };
};
