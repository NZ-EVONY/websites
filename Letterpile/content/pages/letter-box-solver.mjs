// Letter Box Solver (12 letters on four sides). The worked example is computed with the page's own
// search (src/assets/js/wordtools.js).
export default ctx => {
  const { code, fmt, WordTools: T } = ctx;
  const sides = ["tch", "nai", "ole", "pry"];
  const res = T.box(sides);
  const [a, b] = res.pairs[0];
  ctx.assertWords([a, b, "chat"]);
  const bad = !T.boxWords(sides).includes("chat");
  if (!bad) throw new Error("letter-box-solver: CHAT should break the side rule in the example");
  const everyday = res.words.filter(w => T.tier(w)).length;
  return {
    key: "box", path: "/letter-box-solver", file: "letter-box-solver.html", type: "tool", script: "box", wordtools: true,
    title: "Letter Box Solver: Two-Word Solutions | Letterpile",
    description: "Enter the 12 letters on the four sides of a letter box puzzle to see every word that fits the side rule and the shortest two-word solutions.",
    h1: "Letter Box Solver",
    lede: "Type the three letters on each side of the box. The solver lists the shortest two-word solutions first, then every word that fits.",
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row">
            <label class="field"><span>Top side</span><input class="big-input" id="top" type="text" maxlength="4" placeholder="TCH" required></label>
            <label class="field"><span>Right side</span><input class="big-input" id="right" type="text" maxlength="4" placeholder="NAI" required></label>
            <label class="field"><span>Bottom side</span><input class="big-input" id="bottom" type="text" maxlength="4" placeholder="OLE" required></label>
            <label class="field"><span>Left side</span><input class="big-input" id="left" type="text" maxlength="4" placeholder="PRY" required></label>
          </div>
          <label class="check"><input type="checkbox" id="common" checked> Everyday words only</label>
          ${ctx.showAllToggle}
          <div class="row"><button class="btn" type="submit">Solve</button></div>
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Two-word solutions appear here, shortest first, then every word that fits the box.</p></div>`,
    prose: `<p>Letter box puzzles, like Letter Boxed, put twelve letters around the edges of a square, three on each side. You spell words by drawing lines from letter to letter, and the one rule that makes it hard is that two letters in a row can't come from the same side. Each new word must start with the last letter of the word before it, and the goal is to use all twelve letters in as few words as you can. Two words is an excellent score; the daily puzzles usually set a target of four or five.</p>
<h2>How to use it</h2>
<ol>
<li>Type the three letters on each side into its box. The order within a side doesn't matter, and which side you call “top” doesn't either.</li>
<li>Press <b>Solve</b>. The solver finds every word that obeys the side rule, then every pair of words that chain together and use all twelve letters.</li>
<li>Pairs are sorted with everyday words first, then by total length. Untick <b>Everyday words only</b> to see pairs that use rarer words.</li>
<li>Tap any word to look up its definition.</li>
</ol>
<!--@slot after-intro-->
<h2>A worked example</h2>
<p>Suppose the sides are T C H, N A I, O L E and P R Y. ${code("chat")} looks promising but doesn't fit: C and H are both on the top side, so the line from C can't go straight to H. The solver finds ${fmt(res.words.length)} words that do fit, ${fmt(everyday)} of them everyday words, and ${fmt(res.pairCount)} two-word solutions. The first is ${code(a)} then ${code(b)}: ${code(a)} ends on ${code(a.at(-1))}, ${code(b)} starts there, and between them every one of the twelve letters is used.</p>
<h2>How the side rule shapes the words</h2>
<p>Because no two neighboring letters can share a side, double letters are impossible: ${code("ll")} or ${code("ee")} would mean staying on the same side. Common pairs like ${code("th")} or ${code("ch")} only work if their letters sit on different sides. That is why letter box answers often look a little unusual, with letters that alternate between sides, and why long words that do fit are so valuable.</p>
<h2>Strategies for fewer words</h2>
<ul>
<li><b>Start with the awkward letters.</b> Letters like Y, P or a lone vowel on a side of consonants are hardest to place. Find a long word that covers them first.</li>
<li><b>Think about the last letter.</b> A word ending in a common starting letter (S, T, C, P) makes the next word easy to find. A word ending in Y or X can leave you stuck.</li>
<li><b>Count what's left.</b> After a first word, list the letters it missed. The second word needs all of them, plus the first word's last letter to start.</li>
<li><b>Vowels are the bridges.</b> Most sides hold one vowel at most, so words zigzag through vowels on different sides. A side with two vowels is a gift.</li>
</ul>
<h2>Limits and accuracy</h2>
<p>The word list is ENABLE, which includes many rare words that a daily puzzle won't accept, so the <b>Everyday words only</b> box is ticked by default. It keeps words that appear in a list of common English words (SCOWL, sizes 10 to 35). That list isn't any puzzle's answer list, but it's a close match for the words editors tend to allow. The solver shows up to 40 pairs at a time and counts all of them. It looks for one- and two-word solutions only; three-word solutions are far more numerous and easy to find once you have a good first word.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>Everything runs in your browser. The address bar keeps your letters so you can bookmark the puzzle.</p>
<p>Letterpile is not affiliated with any puzzle publisher; trademarks are listed at the foot of the page.</p>`,
    faq: [
      { q: "What counts as a valid word?", a: "A word of at least three letters, made only from the box's letters, where no two letters in a row are on the same side. Letters can be reused." },
      { q: "Why can't I find a word with a double letter?", a: "A double letter means two letters in a row from the same side, which the rule forbids." },
      { q: "How are two-word solutions chosen?", a: "The second word must start with the last letter of the first, and together they must use all twelve letters. Pairs of everyday words come first, then shorter pairs." },
      { q: "Can a solution be one word?", a: "Rarely, but yes: if one word uses all twelve letters, it's listed as a one-word solution." },
      { q: "Why does it suggest words the puzzle rejects?", a: "Daily puzzles use their own word lists. Keep “Everyday words only” ticked to stay close to them." },
      { q: "Does it matter which side I call the top?", a: "No. Only which letters share a side matters, so you can enter the sides in any order." },
    ],
    related: [
      { href: "/letter-hive-solver", label: "Letter Hive Solver" },
      { href: "/word-ladder-solver", label: "Word Ladder Solver" },
      { href: "/word-combiner", label: "Word Combiner" },
      { href: "/guides/solve-daily-word-puzzles", label: "Solving Daily Word Puzzles" },
    ],
  };
};
