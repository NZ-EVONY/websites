// Anagram Solver. Copy reused from the live page and expanded; examples verified against the list.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const listen = ctx.anagrams("listen");
  ctx.assertPhrase("dormitory", "dirty room");
  const sig = w => [...w].sort().join("");
  const map = new Map();
  for (const w of ctx.clean) { const k = sig(w); map.set(k, (map.get(k) || 0) + 1); }
  let bigKey = "", big = 0;
  for (const [k, n] of map) if (n > big || (n === big && k < bigKey)) { big = n; bigKey = k; }
  const family = ctx.clean.filter(w => sig(w) === bigKey);
  const twoDorm = Engine.anagrams("dormitory", { phrases: true }).phrases;
  const none = "rhythm";
  ctx.assertWords([none]);
  const noneCount = Engine.anagrams(none).exact.length;
  return {
    key: "anagram", path: "/anagram-solver", file: "anagram-solver.html", type: "tool", script: "anagram",
    title: "Anagram Solver: Rearrange Letters into Words | Letterpile",
    description: "Find single-word and two-word anagrams of any word or name by rearranging every letter.",
    h1: "Anagram Solver",
    lede: "An anagram uses every letter exactly once. Enter a word, name or short phrase to find single words and two-word phrases made from all of it.",
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row">
            <input class="big-input grow" id="q" type="text" maxlength="24" placeholder="e.g. LISTEN or DORMITORY" aria-label="Word or phrase (up to 15 letters)" required>
            <button class="btn" type="submit">Find anagrams</button>
          </div>
          <label class="check"><input type="checkbox" id="phrases" checked> Include two-word anagrams</label>
          ${ctx.showAllToggle}
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Anagrams will appear here. Example: <kbd>LISTEN</kbd> rearranges into ${ctx.list(listen, 5)}.</p></div>`,
    prose: `<p>An anagram rearranges every letter of a word or phrase into something new. This solver takes up to 15 letters and finds every single word in its list that uses exactly those letters, and, if you like, every pair of words that does. Spaces, capitals and punctuation are ignored, so you can paste a name or a short phrase. It's useful for cryptic crossword clues, jumbles, word games and naming ideas, and it runs entirely in your browser.</p>
<!--@slot after-intro-->
<h2>Anagrams vs. words within</h2>
<p>This page only shows arrangements that use <em>all</em> your letters: <code>LISTEN</code> gives ${ctx.list(listen, 5)}. For shorter words made from some of the letters, use the <a href="/">Word Unscrambler</a>. The difference is the same as between a perfect and a partial anagram, explained in <a href="/guides/anagram-basics">What Is an Anagram?</a></p>
<h2>How to use it</h2>
<ol>
<li>Type a word, name or phrase. Only the letters count.</li>
<li>Leave <b>Include two-word anagrams</b> ticked to see phrase anagrams, or untick it for single words only.</li>
<li>Press <b>Find anagrams</b>. Tap a single word to see its points or look up a definition.</li>
</ol>
<h2>Two-word anagrams</h2>
<p>With two-word anagrams on, the solver splits your letters into two words of at least three letters each from the list. That's how <code>DORMITORY</code> becomes <code>DIRTY ROOM</code>; in total it finds ${fmt(twoDorm.length)} two-word anagrams of DORMITORY. Long inputs produce hundreds of pairs, so the list stops at 400. The pairs are shown in alphabetical order within each pair, so “dirty room” and “room dirty” count once.</p>
<h2>Worked examples</h2>
<ul>
<li>${code("listen")} has ${fmt(listen.length)} single-word anagrams in the list: ${ctx.list(listen, listen.length)}.</li>
<li>The largest set of words sharing one set of letters has ${fmt(big)} members: ${ctx.list(family, family.length)}. Enter any one of them to see the rest.</li>
<li>Some words have no anagram at all: ${code(none)} returns ${fmt(noneCount)} single-word results.</li>
</ul>
<h2>Reading the results</h2>
<p>Single-word anagrams come first, as clickable tiles, with a count. Two-word anagrams follow as plain text. If there are no single-word anagrams, the page says so, and two-word results may still appear. The page address keeps your search so you can share it.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Expecting the input word itself.</b> The solver leaves out your original word from the single-word list.</li>
<li><b>Entering more than 15 letters.</b> Long phrases are rejected; try splitting a phrase and solving each part.</li>
<li><b>Treating every pair as meaningful.</b> Two-word results are just letter matches. The good ones still need a human eye.</li>
</ul>
<h2>Limits and accuracy</h2>
<p>${ctx.WORDLIST_NOTE} Names and capitalized words are not in the list, so a name can be rearranged into common words but not into other names. Two-word search stops at 400 pairs.</p>
<h2>Privacy</h2>
<p>Whatever you type, including a name, is processed in your browser and not sent to Letterpile. A definition lookup, if you ask for one, sends only that word to the dictionary service.</p>
<h2>Where anagrams show up</h2>
<p>Cryptic crossword clues, the Jumble, puzzle hunts, pen names, and party games.</p>`,
    faq: [
      { q: "What's the difference between this and the unscrambler?", a: "The anagram solver uses every letter you enter. The Word Unscrambler also finds shorter words made from some of the letters." },
      { q: "Can I enter a name or a phrase?", a: "Yes. Spaces, capitals and punctuation are ignored, up to 15 letters. Results are made of ordinary words from the list, not names." },
      { q: "How are two-word anagrams found?", a: "The solver tries each word of at least three letters that your letters can make, then checks whether the leftover letters spell another word in the list." },
      { q: "Why does the two-word list stop at 400?", a: "Long inputs can produce thousands of pairs, most of them uninteresting. Stopping at 400 keeps the page fast. Use fewer letters to narrow it." },
      { q: "Why don't I see my own word in the results?", a: "The original word is left out of the single-word anagrams, since it isn't a rearrangement." },
    ],
    related: [
      { href: "/guides/anagram-basics", label: "What Is an Anagram?" },
      { href: "/jumble-solver", label: "Jumble Solver" },
      { href: "/", label: "Word Unscrambler" },
      { href: "/guides/how-word-unscramblers-work", label: "How Word Unscramblers Work" },
    ],
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Spaces and punctuation are ignored, so you can paste a full name and see what it rearranges into.</p></section>`,
  };
};
