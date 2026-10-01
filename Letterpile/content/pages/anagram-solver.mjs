// Anagram Solver. Copy reused from the live page; examples verified against the list.
export default ctx => {
  const listen = ctx.anagrams("listen");
  ctx.assertPhrase("dormitory", "dirty room");
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
    prose: `<h2>Anagrams vs. words within</h2>
        <p>This page only shows arrangements that use <em>all</em> your letters: <code>LISTEN</code> gives ${ctx.list(listen, 5)}. For shorter words made from some of the letters, use the <a href="/">Word Unscrambler</a>.</p>
        <h2>Two-word anagrams</h2>
        <p>With two-word anagrams on, the solver splits your letters into two words of at least three letters each from the list. That's how <code>DORMITORY</code> becomes <code>DIRTY ROOM</code>. Long inputs produce hundreds of pairs, so the list stops at 400.</p>
        <h2>Where anagrams show up</h2>
        <p>Cryptic crossword clues, the Jumble, puzzle hunts, pen names, and party games.</p>`,
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Spaces and punctuation are ignored, so you can paste a full name and see what it rearranges into.</p></section>`,
  };
};
