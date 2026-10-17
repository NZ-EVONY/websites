// Letter Hive Solver (honeycomb puzzles: seven letters, one required). The worked example is
// computed with the same search the page runs (src/assets/js/wordtools.js).
export default ctx => {
  const { code, fmt, WordTools: T } = ctx;
  const res = T.hive("mchine", "a");
  const pangrams = res.filter(x => x.pangram).map(x => x.word);
  const common = res.filter(x => x.common);
  ctx.assertWords(["machine", "mechanic", "chain", "mania"]);
  if (!pangrams.includes("machine") || !pangrams.includes("mechanic")) throw new Error("letter-hive-solver: example pangrams changed");
  const doubled = common.find(x => /(.)\1/.test(x.word)).word;
  const longest = res.filter(x => !x.pangram).sort((a, b) => b.word.length - a.word.length)[0].word;
  return {
    key: "hive", path: "/letter-hive-solver", file: "letter-hive-solver.html", type: "tool", script: "hive", wordtools: true,
    title: "Letter Hive Solver: Every Word and Pangram | Letterpile",
    description: "Enter the seven letters of a honeycomb word puzzle and the required center letter to list every word, with pangrams highlighted.",
    h1: "Letter Hive Solver",
    lede: "Type the six outer letters and the center letter. Every word of four or more letters that uses the center letter appears below, pangrams first.",
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row">
            <label class="field grow2"><span>Outer letters</span><input class="big-input" id="outer" type="text" maxlength="12" placeholder="e.g. MCHINE" required></label>
            <label class="field narrow"><span>Center letter</span><input class="big-input" id="center" type="text" maxlength="1" placeholder="A" required></label>
          </div>
          <div class="row">
            <label class="field"><span>Shortest word</span><select id="min"><option value="3">3 letters</option><option value="4" selected>4 letters</option><option value="5">5 letters</option></select></label>
            <label class="field"><span>Starts with</span><select id="start"><option value="">Any letter</option></select></label>
            <label class="field"><span>Length</span><select id="len"><option value="">Any length</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option><option value="8">8</option><option value="9">9 or more</option></select></label>
          </div>
          <label class="check"><input type="checkbox" id="common"> Everyday words only</label>
          ${ctx.showAllToggle}
          <div class="row"><button class="btn" type="submit">Find words</button></div>
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Words appear here, grouped by length. A pangram uses all seven letters and is shown in its own group.</p></div>`,
    prose: `<p>Honeycomb word puzzles, such as Spelling Bee, give you seven letters arranged in a hive: one in the middle, six around it. Every word you find must use the middle letter, may use any of the others as often as it likes, and must be at least four letters long. A word that uses all seven letters at least once is a pangram, and it usually scores a bonus. This solver lists every word in our word list that follows those rules, so you can check how many you've missed or find the pangram you can't quite see.</p>
<h2>How to use it</h2>
<ol>
<li>Type the six outer letters in any order. Spaces and repeated letters are ignored.</li>
<li>Type the center letter in its own box. Every result contains it.</li>
<li>Press <b>Find words</b>. Pangrams come first, then every other word grouped by length, longest first.</li>
<li>Narrow the list with <b>Starts with</b> and <b>Length</b>, which many puzzles use for their hint grids, or tick <b>Everyday words only</b> to hide rare words.</li>
</ol>
<!--@slot after-intro-->
<h2>A worked example</h2>
<p>Take the outer letters M, C, H, I, N and E, with A in the center. The solver finds ${fmt(res.length)} words of four or more letters, and ${fmt(pangrams.length)} of them use all seven letters: ${ctx.list(pangrams, pangrams.length)}. Both ${code("machine")} and ${code("mechanic")} are everyday words, which is typical: puzzle makers like a pangram that most players know. Among the rest, ${code("chain")} and ${code("mania")} show how letters can repeat, and the longest word that isn't a pangram is ${code(longest)}.</p>
<p>Only ${fmt(common.length)} of the ${fmt(res.length)} words are on our list of everyday words. That gap is the main thing to know about any solver like this one, explained below.</p>
<h2>Why the solver finds more words than your puzzle accepts</h2>
<p>Daily honeycomb puzzles use their own hand-edited answer lists. They leave out obscure words, most proper nouns, hyphenated words and anything an editor thinks is unfair or unpleasant. This solver uses ENABLE, a large open word list built for word games, so it includes many words a puzzle won't take. The <b>Everyday words only</b> box filters the results down to words that appear in a list of common English words (SCOWL, sizes 10 to 35). It isn't any puzzle's answer list, but it brings the results much closer to what puzzle editors usually accept.</p>
<p>The reverse happens too, though rarely: a puzzle may accept a newer word that ENABLE, compiled years ago, doesn't contain. If a word your puzzle accepted isn't listed here, that's why.</p>
<h2>Tips for finding words yourself</h2>
<ul>
<li><b>Start with the center letter's common partners.</b> If the center is A, try endings like -AN, -AL and -ATE with the outer letters.</li>
<li><b>Look for suffixes.</b> If E, D, N, I, G or S are outer letters, words ending -ED, -ING or -ER multiply quickly.</li>
<li><b>Hunt the pangram by structure.</b> A pangram needs all seven letters, so it's often seven or eight letters long. Try to build it around a common ending made from the outer letters.</li>
<li><b>Repeat letters.</b> Players often forget that letters can be reused. In the example above, ${code(doubled)} doubles a letter, and words like it are easy to miss.</li>
</ul>
<h2>Using the filters with hint grids</h2>
<p>Many honeycomb puzzles publish a hint grid: a table showing how many answers start with each letter and how long they are. The <b>Starts with</b> and <b>Length</b> menus let you look at one cell of that grid at a time, so you can confirm that a group exists without seeing every answer at once. Set <b>Shortest word</b> to three letters for variants that allow short words, or to five for a harder game.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>The letters you type stay in your browser; the search runs on your device. The address bar keeps your letters so you can bookmark or share a search.</p>
<p>Letterpile is not affiliated with any puzzle publisher; trademarks are listed at the foot of the page.</p>`,
    faq: [
      { q: "What is a pangram?", a: "A word that uses every one of the seven letters at least once. Some puzzles call a pangram that uses each letter exactly once a perfect pangram." },
      { q: "Why does the solver list words my puzzle rejects?", a: "Puzzles use their own edited answer lists. This solver uses the open ENABLE list, which includes many rare words. Tick “Everyday words only” to hide most of them." },
      { q: "Can letters be used more than once?", a: "Yes. Every result may reuse any letter as many times as it likes, which is the standard rule for honeycomb puzzles." },
      { q: "Do I have to enter exactly six outer letters?", a: "No. The solver uses whatever letters you type, so it works for variants with more or fewer letters too. The center letter is always required." },
      { q: "Does it know today's answers?", a: "No. It has no connection to any puzzle and doesn't know which words a puzzle will accept. It only lists words that follow the rules." },
      { q: "Can I find words of three letters?", a: "Yes. Change “Shortest word” to 3 letters." },
    ],
    related: [
      { href: "/word-grid-solver", label: "Word Grid Solver" },
      { href: "/letter-box-solver", label: "Letter Box Solver" },
      { href: "/", label: "Word Unscrambler" },
      { href: "/guides/hooks-prefixes-and-suffixes", label: "Hooks, Prefixes and Suffixes" },
    ],
  };
};
