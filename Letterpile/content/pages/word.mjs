// Word pages hub and lookup (/word): a box to look up any word (facts computed in the browser by
// js/word.js and js/wordtools.js), and links to every static word page. Rendered late so it can
// list them. With ?w=, the script fills in that word, or goes to its static page if it has one.
export const late = true;
export default ctx => {
  const { fmt, code } = ctx;
  const words = ctx.wordPageWords;
  const byLetter = new Map();
  for (const w of words) { if (!byLetter.has(w[0])) byLetter.set(w[0], []); byLetter.get(w[0]).push(w); }
  const n = words.length;
  return {
    key: "word", path: "/word", file: "word.html", type: "hub", script: "word", wordtools: true, webapp: true, appName: "Word lookup",
    title: "Word Lookup: Points, Anagrams and Hooks | Letterpile",
    description: `Look up any word for its points, anagrams, the words inside it, longer words containing it and its hooks. Includes pages for ${fmt(n)} common words.`,
    h1: "Word pages",
    prose: `<form class="tool-form" id="form" autocomplete="off" data-warm>
<div class="row"><input class="big-input grow" id="w" type="text" maxlength="20" placeholder="Type a word" aria-label="Word to look up" required><button class="btn" type="submit">Look up</button></div>
</form>
<div class="results results--short" id="result" aria-live="polite"></div>
<p>Every word has more to it than its spelling. Type one above to see whether it's in our word list, what it scores with common tile values and with Words With Friends values, which other words use exactly the same letters, which shorter words hide inside it, which longer words contain it, and which single letters can be added to its front or back to make a new word. The details are worked out in your browser from the same open word list (ENABLE) that all of our tools use.</p>
<p>The ${fmt(n)} most common English words of three to eight letters also have a page of their own, listed below by first letter. Those pages add rhymes and syllable counts from the CMU Pronouncing Dictionary, and they're quick to share or bookmark: ${code("planet")} lives at <a href="/word/planet">/word/planet</a>, for example. Any other word can be looked up here, and the address bar keeps it so you can share that too.</p>
<h2>What each part means</h2>
<ul>
<li><b>Anagrams</b> use every letter exactly once. ${code("listen")} and ${code("silent")} are anagrams.</li>
<li><b>Words inside it</b> use some of its letters, each no more often than it appears, in any order: the words you could make from those tiles.</li>
<li><b>Longer words containing it</b> include it as an unbroken run of letters, the way ${code("planetary")} contains ${code("planet")}.</li>
<li><b>Hooks</b> are single letters added to one end to make another word. In board games they let you play a word alongside one that's already there.</li>
</ul>
<p>Words the tools hide by default (vulgar words and slurs) don't get pages and aren't shown in these lists. Tap any word in a tool's results to see its points and hooks, and use the link in that window to come here.</p>
<h2>Pages for common words</h2>
${[...byLetter].map(([l, ws]) => `<h3>${l.toUpperCase()} <span class="count">${ws.length}</span></h3>\n<ul class="link-cols">${ws.map(w => `<li><a href="/word/${w}">${w}</a></li>`).join("")}</ul>`).join("\n")}`,
    related: [
      { href: "/", label: "Word Unscrambler" },
      { href: "/anagram-solver", label: "Anagram Solver" },
      { href: "/lists", label: "Curated word lists" },
      { href: "/words-by-length", label: "Words by length" },
    ],
  };
};
