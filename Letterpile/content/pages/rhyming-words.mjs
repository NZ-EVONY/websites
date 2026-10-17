// Rhyming Words finder. Rhymes come from the CMU Pronouncing Dictionary (scripts/lexicon), shipped
// as /data/rhymes.*.json; the examples here use the same data.
export default ctx => {
  const { code, fmt, pron, rhymeTail, syllables } = ctx;
  const tails = new Map();
  for (const [w, p] of pron) { const t = rhymeTail(p); if (!tails.has(t)) tails.set(t, []); tails.get(t).push(w); }
  const rhymes = w => (tails.get(rhymeTail(pron.get(w))) || []).filter(x => x !== w);
  const rh = rhymes("rhyme"), tb = rhymes("table"), or = rhymes("orange"), sv = rhymes("silver"), mo = rhymes("month");
  ctx.assertWords(["rhyme", "time", "table", "orange", "silver", "month"]);
  if (!rh.includes("time")) throw new Error("rhyming-words: RHYME should rhyme with TIME");
  const twoSyl = rh.filter(w => syllables(pron.get(w)) === 2);
  // Near rhymes of TABLE: same last syllable ("AH L"), different stressed vowel.
  const last = t => { const ph = t.split(" "); let i = ph.length - 1; while (i > 0 && !/^[AEIOU]/.test(ph[i])) i--; return ph.slice(i).join(" "); };
  const tTail = rhymeTail(pron.get("table"));
  const near = [...tails].filter(([t]) => t !== tTail && last(t) === last(tTail)).flatMap(([, ws]) => ws).filter(w => ctx.WordTools.tier(w) === 2).sort();
  return {
    key: "rhymes", path: "/rhyming-words", file: "rhyming-words.html", type: "tool", script: "rhymes",
    title: "Rhyming Words Finder: Perfect and Near Rhymes | Letterpile",
    description: "Type a word to find words that rhyme with it, grouped by syllable count, with near rhymes for when no perfect rhyme fits.",
    h1: "Rhyming Words Finder",
    lede: "Type a word to see every word that rhymes with it, grouped by syllables, plus near rhymes that share only the last syllable.",
    tool: `<form class="tool-form" id="form" autocomplete="off" data-rhymes="${ctx.assets["rhymes.json"]}">
          <div class="row">
            <label class="field grow2"><span>Word</span><input class="big-input" id="word" type="text" maxlength="20" placeholder="e.g. RHYME" required></label>
          </div>
          <div class="row"><button class="btn" type="submit">Find rhymes</button></div>
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Rhymes appear here, shortest words first. Tap a word for its definition.</p></div>`,
    prose: `<p>Two words rhyme when they sound the same from their last stressed vowel to the end: ${code("rhyme")} and ${code("time")}, ${code("table")} and ${code("cable")}. Spelling is no guide (${code("though")} and ${code("throw")} rhyme; ${code("though")} and ${code("tough")} don't), so this finder works from pronunciations rather than letters. It uses the CMU Pronouncing Dictionary, an open dictionary of American English pronunciations, limited to the ${fmt(pron.size)} words that are also in our word list.</p>
<h2>How to use it</h2>
<ol>
<li>Type a word and press <b>Find rhymes</b>.</li>
<li><b>Perfect rhymes</b> share every sound from the last stressed vowel onward. They're grouped by syllable count, so you can pick a word that fits your meter.</li>
<li><b>Near rhymes</b> share only the last syllable's sounds. They're the fallback for words with few perfect rhymes, and songwriters use them all the time.</li>
<li>Tap any word for its definition.</li>
</ol>
<!--@slot after-intro-->
<h2>Examples</h2>
<p>${code("rhyme")} has ${fmt(rh.length)} perfect rhymes in the list, including ${ctx.list(rh.filter(w => w.length <= 5), 4)}${twoSyl.length ? `, and two-syllable options like ${ctx.list(twoSyl, 2)}` : ""}. ${code("table")} has ${fmt(tb.length)}, among them ${ctx.list(tb, 3)}.</p>
<p>Then there are the famously hard ones. ${code("orange")} has ${or.length ? `just ${fmt(or.length)} perfect rhyme${or.length === 1 ? "" : "s"} here (${ctx.list(or, or.length)})` : "no perfect rhyme in the list at all"}, ${code("silver")} has ${sv.length ? fmt(sv.length) : "none"}, and ${code("month")} has ${mo.length ? fmt(mo.length) : "none"}. For words like these, the near rhymes are where the useful answers are.</p>
<h2>How rhymes are matched</h2>
<p>Each word in the pronunciation dictionary is written as a string of sounds, with each vowel marked for stress. The finder takes the sounds from the last vowel with main stress to the end of the word and looks for other words with exactly the same sounds. For ${code("table")}, that's the “AY-bul” at the end, which is why ${code("cable")} rhymes and ${code("tablet")} doesn't. Stress matters: ${code("rebel")} the noun and ${code("rebel")} the verb are stressed differently, and the dictionary lists the more common pronunciation first, which is the one used here.</p>
<p>Near rhymes are matched from the last vowel of the word, stressed or not. For ${code("table")}, they include everyday words like ${ctx.list(near, 3)}: the endings match, the stressed vowels don't. Some near rhymes work better than others, so read the list with your ear, not just your eye.</p>
<h2>Writing with rhymes</h2>
<ul>
<li><b>Pick the line-ending word last.</b> Find the rhyme sound first, then write the line toward it.</li>
<li><b>Match the syllables.</b> A one-syllable rhyme ends a line firmly; a two- or three-syllable rhyme (a “feminine” rhyme) sounds lighter and often comic.</li>
<li><b>Count your meter.</b> Our <a href="/syllable-counter">Syllable Counter</a> checks the syllables in a whole line or verse.</li>
</ul>
<h2>Limits</h2>
<p>Pronunciations are American English, so some rhymes won't work in other accents, and the reverse. Only the first listed pronunciation of each word is used. Words not in the pronunciation dictionary, which includes many rare words, plurals of rare words and brand-new words, can't be looked up.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>The rhyme list loads into your browser once, and lookups happen on your device.</p>`,
    faq: [
      { q: "What's the difference between a perfect and a near rhyme?", a: "Perfect rhymes share every sound from the last stressed vowel to the end. Near rhymes share only the last syllable's sounds, so they're looser." },
      { q: "Why doesn't a word that looks similar appear?", a: "Rhyming is about sound, not spelling. Words that look alike can sound different, like THOUGH and TOUGH." },
      { q: "Which accent does it use?", a: "American English, from the CMU Pronouncing Dictionary. Some rhymes differ in British, Australian or New Zealand English." },
      { q: "Why can't it find my word?", a: "The word isn't in the pronunciation dictionary. Try a more common form, such as the singular." },
      { q: "Where do the pronunciations come from?", a: "The CMU Pronouncing Dictionary from Carnegie Mellon University, used under its open licence; see the credit at the bottom of every page." },
    ],
    related: [
      { href: "/syllable-counter", label: "Syllable Counter" },
      { href: "/anagram-solver", label: "Anagram Solver" },
      { href: "/word-combiner", label: "Word Combiner" },
      { href: "/guides", label: "Word game guides" },
    ],
  };
};
