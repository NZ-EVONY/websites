// Syllable Counter. Counts come from the CMU Pronouncing Dictionary (scripts/lexicon) where a word
// is listed, and a spelling rule of thumb (marked ~) where it isn't.
export default ctx => {
  const { code, fmt, pron, syllables } = ctx;
  const n = w => syllables(pron.get(w));
  ctx.assertWords(["fire", "every", "chocolate", "camera", "poem", "cafe"]);
  const lines = ["letters in a pile", "each word that you take away", "lets the others fall"];
  const n1 = w => (w === "a" || w === "i" ? 1 : n(w));
  const counts = lines.map(l => l.split(" ").reduce((s, w) => s + n1(w), 0));
  const tricky = ["fire", "every", "chocolate", "camera", "poem"].map(w => `${code(w)} (${n(w)})`);
  return {
    key: "syllables", path: "/syllable-counter", file: "syllable-counter.html", type: "tool", script: "syllables",
    title: "Syllable Counter: Syllables per Word and Line | Letterpile",
    description: "Paste a word, a line or a whole poem to count its syllables, word by word and line by line, from a pronunciation dictionary.",
    h1: "Syllable Counter",
    lede: "Type or paste text. Each word gets its syllable count, and each line gets a total, as you type.",
    tool: `<form class="tool-form" id="form" autocomplete="off" data-rhymes="${ctx.assets["rhymes.json"]}">
          <label class="field"><span>Your text</span><textarea id="text" rows="5" maxlength="5000" placeholder="Type a word, a line, or paste a poem"></textarea></label>
          <div class="row"><button class="btn" type="submit">Count syllables</button></div>
        </form>
        <div class="results results--short" id="results" aria-live="polite"><p class="empty">Counts appear here, one row per line.</p></div>`,
    prose: `<p>A syllable is a beat of sound built around a vowel: ${code("cat")} has one, ${code("table")} two, ${code("banana")} three. Counting them matters for poetry with a fixed meter, for song lyrics that must fit a tune, for readability scores and for haiku. Counting by eye is unreliable, because English spelling hides syllables (${code("fire")}) and invents them (${code("cafe")} looks like one syllable but has two). This counter uses a pronunciation dictionary instead.</p>
<h2>How to use it</h2>
<ol>
<li>Type or paste your text. It's counted as you type.</li>
<li>Each word shows its syllable count in small print after it, and each line's total is shown at the right.</li>
<li>A count marked with ~ is an estimate from the spelling, used for words that aren't in the pronunciation dictionary.</li>
</ol>
<!--@slot after-intro-->
<h2>A worked example: haiku</h2>
<p>A traditional English haiku has three lines of five, seven and five syllables. Here is a short one about our <a href="/games/letterpile">Letterpile</a> game, counted line by line:</p>
<ul>${lines.map((l, i) => `<li>${code(l)}: ${counts[i]} syllables</li>`).join("")}</ul>
<p>That comes to ${counts.join(", ")}${counts.join("-") === "5-7-5" ? ": a perfect fit" : ", so one line needs work"}. Notice ${code("every")}-style words: a draft line of “each word you take away” would come up a syllable short. Paste your own draft above to check it the same way.</p>
<h2>Where counts differ</h2>
<p>Many words have more than one accepted pronunciation, and accents differ. The dictionary used here gives these counts: ${tricky.join(", ")}. You may say ${code("fire")} as two syllables, ${code("every")} as two and ${code("chocolate")} as two, and many people do. In poetry, the poet's own pronunciation is what counts, so treat close calls as choices rather than errors. Only the first listed pronunciation of each word is used.</p>
<h2>How the estimate works</h2>
<p>For words that aren't in the dictionary, the counter falls back on a rule of thumb: count the groups of vowels (A, E, I, O, U and Y), then drop a silent E at the end of a word, unless the word ends in -LE after a consonant, as in ${code("table")}. Every word has at least one syllable. The rule is right most of the time but not always, which is why those counts are marked with ~.</p>
<h2>Where it helps</h2>
<ul>
<li><b>Poetry and lyrics</b>: check meter line by line before you read a piece aloud.</li>
<li><b>Haiku and other fixed forms</b>: confirm 5-7-5, or the 7-7 of the closing lines of a tanka.</li>
<li><b>Readability</b>: formulas like Flesch reading ease use average syllables per word; long-syllabled text reads harder.</li>
<li><b>Song lyrics</b>: compare a verse with the one before it. Lines sung to the same tune usually need similar totals, and the per-line counts show at a glance which line is crowded.</li>
<li><b>Teaching</b>: a quick check for children practicing clapping out syllables.</li>
</ul>
<h2>Data and limits</h2>
<p>Counts come from the CMU Pronouncing Dictionary, limited to the ${fmt(pron.size)} words that are also in our word list. Pronunciations are American English. Numbers, symbols and abbreviations aren't counted.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>Your text never leaves your browser. Short texts (up to 300 characters) are kept in the address bar so you can share a count.</p>`,
    faq: [
      { q: "Why does a count have a ~ in front of it?", a: "The word isn't in the pronunciation dictionary, so its count is an estimate from the spelling." },
      { q: "Why does it say FIRE has one syllable?", a: "That's the dictionary's main pronunciation. Many speakers say it with two; in your own writing, go with how you say it." },
      { q: "Does it count numbers?", a: "No. Write numbers as words (twenty-one) to count them." },
      { q: "Can I paste a whole poem?", a: "Yes, up to 5,000 characters. Each line gets its own total." },
      { q: "Which accent does it use?", a: "American English, from the CMU Pronouncing Dictionary." },
    ],
    related: [
      { href: "/rhyming-words", label: "Rhyming Words Finder" },
      { href: "/word-scrambler", label: "Word Scrambler" },
      { href: "/words-by-length", label: "Words by length" },
      { href: "/guides", label: "Word game guides" },
    ],
  };
};
