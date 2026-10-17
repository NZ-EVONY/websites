// Word Ladder Solver. The worked examples are computed with the page's own search
// (src/assets/js/wordtools.js), using everyday words for the steps.
export default ctx => {
  const { code, fmt, WordTools: T } = ctx;
  const cw = T.ladder("cold", "warm", { common: true });
  const ht = T.ladder("head", "tail", { common: true });
  const cd = T.ladder("cat", "dog", { common: true });
  const lg = T.ladder("lead", "gold", { common: true });
  const am = T.ladder("ape", "man", { common: true });
  const amAll = T.ladder("ape", "man");
  if (!cw || !ht || !cd || !lg || !am || !amAll) throw new Error("word-ladder-solver: an example ladder no longer exists");
  const show = p => p.map(w => code(w)).join(" → ");
  const four = ctx.clean.filter(w => w.length === 4).length;
  return {
    key: "ladder", path: "/word-ladder-solver", file: "word-ladder-solver.html", type: "tool", script: "ladder", wordtools: true,
    title: "Word Ladder Solver: Shortest Path Between Words | Letterpile",
    description: "Find the shortest word ladder between two words of the same length, changing one letter at a time, with everyday words for every step.",
    h1: "Word Ladder Solver",
    lede: "Enter a start word and an end word of the same length. The solver finds the shortest ladder, changing one letter per step.",
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row end">
            <label class="field"><span>Start word</span><input class="big-input" id="from" type="text" maxlength="12" placeholder="e.g. COLD" required></label>
            <button class="btn secondary" type="button" id="swap" aria-label="Swap start and end words">⇄</button>
            <label class="field"><span>End word</span><input class="big-input" id="to" type="text" maxlength="12" placeholder="e.g. WARM" required></label>
          </div>
          <div class="row">
            <label class="field grow2"><span>Avoid these words</span><input id="avoid" type="text" placeholder="Optional, separated by spaces"></label>
          </div>
          <label class="check"><input type="checkbox" id="common" checked> Everyday words for the steps</label>
          ${ctx.showAllToggle}
          <div class="row"><button class="btn" type="submit">Find ladder</button></div>
        </form>
        <div class="results results--short" id="results" aria-live="polite"><p class="empty">The ladder appears here, with the changed letter marked on each step.</p></div>`,
    prose: `<p>A word ladder turns one word into another by changing a single letter at a time, and every step along the way must be a real word. Lewis Carroll published the puzzle in 1879 under the name “doublets”, and it still turns up in newspapers, classrooms and puzzle apps. This solver finds the shortest possible ladder between two words, so you can check your answer, get unstuck, or set a puzzle for someone else.</p>
<h2>How to use it</h2>
<ol>
<li>Type the start word and the end word. They must have the same number of letters.</li>
<li>Press <b>Find ladder</b>. Each step is shown with the changed letter underlined.</li>
<li>Keep <b>Everyday words for the steps</b> ticked to stick to common words. If no everyday ladder exists, the solver says so and shows the shortest one through any words in the list.</li>
<li>If you don't like a step, add it to <b>Avoid these words</b> and solve again to get a different ladder of the same or the next shortest length.</li>
</ol>
<!--@slot after-intro-->
<h2>Worked examples</h2>
<p>One of Carroll's own examples was to turn ${code("head")} into ${code("tail")}. With everyday words, the shortest ladder is ${ht.length - 1} steps: ${show(ht)}. Turning ${code("cold")} into ${code("warm")} takes ${cw.length - 1}: ${show(cw)}. Others are quicker: ${show(cd)}, and ${show(lg)}, which turns lead into gold in ${lg.length - 1} moves.</p>
<p>Some pairs take longer. Carroll also asked readers to evolve ${code("man")} from ${code("ape")}. Turning ${code("ape")} into ${code("man")} through everyday words takes ${am.length - 1} steps: ${show(am)}. ${amAll.length < am.length ? `If rare words are allowed, it shrinks to ${amAll.length - 1}: ${show(amAll)}.` : "Allowing rare words doesn't make it any shorter."}</p>
<h2>How the solver works</h2>
<p>The solver treats every word of the right length as a stop on a map, with a road between any two words that differ by one letter. It then explores outward from the start word one step at a time, which is called a breadth-first search: first every word one change away, then every word two changes away, and so on. The first time it reaches the end word, the route it took is guaranteed to be as short as possible. There are ${fmt(four)} four-letter words in our list, and the search checks them in a fraction of a second.</p>
<p>When there's more than one shortest ladder, the solver shows the first it finds. Avoiding a word forces it to look for another route, which is the easiest way to see alternatives.</p>
<h2>Tips for solving ladders by hand</h2>
<ul>
<li><b>Fix the vowels first.</b> Vowel changes are often the bottleneck, because most words have only one or two. Plan where each vowel changes.</li>
<li><b>Work from both ends.</b> Write a few words one step from the end word, and look for a meeting point.</li>
<li><b>Letters already in place stay put.</b> If the start and end words share a letter in the same position, try to leave it alone.</li>
<li><b>Count the differences.</b> The ladder can't be shorter than the number of positions where the two words differ. ${code("cold")} and ${code("warm")} differ in all four, so four steps is the best possible.</li>
</ul>
<h2>Limits</h2>
<p>All steps must have the same length; ladders that add or remove letters are a different puzzle. Everyday words are those in a list of common English words (SCOWL, sizes 10 to 35); the start and end words can be any words in ENABLE. Some pairs have no ladder at all, usually because one of the words has no neighbors in the list.</p>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>The search runs in your browser. The address bar keeps your words so you can share a ladder.</p>`,
    faq: [
      { q: "What is the shortest a ladder can be?", a: "At least the number of letter positions where the two words differ. COLD and WARM differ in all four positions, so no ladder can be shorter than four steps." },
      { q: "Why did it use a strange word?", a: "Add the word to “Avoid these words” and solve again to get a different route. With “Everyday words for the steps” ticked, rare words appear only when no everyday ladder exists." },
      { q: "Can the words be different lengths?", a: "No. Every step changes one letter in place, so all the words have the same length." },
      { q: "Does it find every shortest ladder?", a: "It shows one shortest ladder. To see others, add a step you'd like to change to the avoid list and solve again." },
      { q: "Who invented word ladders?", a: "Lewis Carroll published them as “doublets” in 1879. Turning HEAD into TAIL was one of his examples." },
    ],
    related: [
      { href: "/letter-box-solver", label: "Letter Box Solver" },
      { href: "/hangman-solver", label: "Hangman Solver" },
      { href: "/words-by-length", label: "Words by length" },
      { href: "/word-scrambler", label: "Word Scrambler" },
    ],
  };
};
