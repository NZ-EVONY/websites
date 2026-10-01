// Jumble Solver. Copy reused from the live page and expanded; the example is computed.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const puzzle = ["elbat", "odrw", "ypapl", "kecal"];
  const answers = puzzle.map(w => {
    const a = Engine.anagrams(w).exact;
    return ctx.cleanSet.has(w) ? [w, ...a] : a;
  });
  const fin = "tsaeb";
  const finWords = [...(ctx.cleanSet.has(fin) ? [fin] : []), ...Engine.anagrams(fin).exact];
  const multi = answers.map((a, i) => [puzzle[i], a]).filter(([, a]) => a.length > 1);
  return {
    key: "jumble", path: "/jumble-solver", file: "jumble-solver.html", type: "tool", script: "jumble",
    title: "Jumble Solver: Solve Scrambled Words at Once | Letterpile",
    description: "Solve a whole jumble puzzle at once: enter each scrambled word, then get help with the final bonus phrase.",
    h1: "Jumble Solver",
    lede: "Enter each scrambled word from your puzzle, one per box. Every one is solved at once, then the circled letters can be worked on for the final answer.",
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row" id="inputs"></div>
          <div class="row">
            <button class="btn" type="submit">Solve all</button>
            <button class="btn secondary" type="button" id="add">+ Add word</button>
            <button class="btn secondary" type="button" id="clear">Clear</button>
          </div>
          <label class="field mt"><span>Final puzzle letters (optional)</span>
            <input class="big-input" id="final" type="text" maxlength="18" placeholder="The circled letters"></label>
          ${ctx.showAllToggle}
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Answers will appear here, one group per scrambled word.</p></div>`,
    prose: `<p>Newspaper-style jumble puzzles give you a handful of scrambled words, then ask you to use some of their letters to answer a riddle. This solver handles both parts. Type each scrambled word in its own box (up to eight) and press <b>Solve all</b> to see every word each one can make with all its letters. Then type the circled letters to get single-word and two-word suggestions for the final answer. It's built for getting unstuck on one word as much as for checking the whole puzzle.</p>
<h2>Solving a jumble</h2>
<ol>
<li>Type each scrambled word into its own box. Order doesn't matter. Use <b>+ Add word</b> for more boxes.</li>
<li>Press <b>Solve all</b>. Most jumble words have exactly one answer; where there are several, pick the one whose circled letters make sense.</li>
<li>Collect the circled letters into <b>Final puzzle letters</b> for single-word and two-word answers to the cartoon's punchline. Longer punchlines usually need some human judgment, but the pairs are a strong head start.</li>
</ol>
<p>If a box shows no answer, check for a mistyped letter. Newspaper jumbles tend to use everyday words, so the answer is usually the most familiar word in the results.</p>
<!--@slot after-intro-->
<h2>A worked example</h2>
<p>Here is a made-up four-word puzzle and what the solver returns for each word:</p>
<table>
<tr><th>Scrambled</th><th>Answers in the list</th></tr>
${puzzle.map((w, i) => `<tr><td>${code(w)}</td><td>${answers[i].length ? answers[i].map(code).join(", ") : "none"}</td></tr>`).join("")}
</table>
<p>${multi.length ? `${multi.map(([w, a]) => `${code(w)} has ${a.length} possible answers`).join(" and ")}, which is common: a puzzle maker usually intends the most everyday one, and the circled letters can confirm it.` : "Each word has a single answer here."} If the circled letters were ${code(fin)}, the final box would offer ${ctx.list(finWords, finWords.length)}.</p>
<h2>Reading the results</h2>
<p>Each scrambled word gets its own group, headed by the letters you typed and the number of answers. If the letters you typed already form a word, it's included too. The final-letters group shows single words first, then up to 200 two-word phrases (for six or more letters).</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Missing a letter.</b> Jumble words use every letter exactly once; one wrong letter means no answer.</li>
<li><b>Expecting the punchline in one go.</b> Many punchlines are three or more words, which the solver doesn't attempt. Pull out a likely short word first, then solve what's left.</li>
<li><b>Choosing an obscure answer.</b> The list contains rare words; the puzzle's answer is almost always a familiar one.</li>
</ul>
<h2>Limits and accuracy</h2>
<p>${ctx.WORDLIST_NOTE} The solver has no idea what the riddle says, so it can't rank answers by meaning. Words up to 12 letters per box and 18 final letters are accepted.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>Your letters are solved in your browser and are not sent to Letterpile. They appear in the page address so you can share the puzzle.</p>`,
    faq: [
      { q: "How many words can I solve at once?", a: "Up to eight scrambled words, plus the final letters. Four boxes are shown to start; use + Add word for more." },
      { q: "Why does one word have several answers?", a: "Some letter sets spell more than one word. Pick the one that gives sensible circled letters; puzzle makers usually choose the most familiar word." },
      { q: "Can it solve the final phrase?", a: "It suggests single words and two-word phrases made from all the final letters. Longer phrases need human judgment." },
      { q: "A word shows no match. What now?", a: "Check each letter against the puzzle. If they're right, the answer may not be in the ENABLE word list the site uses." },
      { q: "Does it work for other scrambled-word puzzles?", a: "Yes. Any puzzle where a word is scrambled and every letter must be used works the same way." },
    ],
    related: [
      { href: "/anagram-solver", label: "Anagram Solver" },
      { href: "/guides/anagram-basics", label: "What Is an Anagram?" },
      { href: "/", label: "Word Unscrambler" },
      { href: "/word-scrambler", label: "Word Scrambler" },
    ],
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Stuck on the punchline? Try pulling the most likely short word, like THE or AN, out of the final letters first, then solve what's left.</p></section>`,
  };
};
