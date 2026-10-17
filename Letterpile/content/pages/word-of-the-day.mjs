// Word of the Day (/word-of-the-day): one everyday word a day with a note on its meaning and usage
// (written for the site, approved by the owner) and a fact for word games computed from the list.
// Published through the daily engine (scripts/games/wotd.mjs); src/assets/games/wotd.js shows it.
export const late = true; // needs the word-page list
export default ctx => ({
  key: "wotd", section: "games", path: "/word-of-the-day", file: "word-of-the-day.html", type: "game", game: "wotd", games: ["wotd"],
  title: "Word of the Day: An Everyday Word, Explained | Letterpile",
  description: "One everyday English word a day: what it means, how it's used and a fact for word games. New at midnight UTC, with the last week's words.",
  h1: "Word of the Day",
  crumbs: [{ name: "Home", path: "/" }, { name: "Word of the Day", path: "/word-of-the-day" }],
  tool: `<div class="wotd" id="wotd" aria-live="polite">
          <p class="wotd-word"><span id="wdWord">…</span></p>
          <dl class="wotd-notes">
            <dt>Meaning</dt><dd id="wdMeaning">Loading today's word…</dd>
            <dt>In use</dt><dd id="wdUsage"></dd>
            <dt>For word games</dt><dd id="wdFact"></dd>
          </dl>
          <p class="wotd-more"><span class="pill" id="wdPoints"></span> <a id="wdPage" href="/word">Anagrams, hooks and rhymes for this word</a></p>
          <h2>Earlier this week</h2>
          <ul class="wotd-archive" id="wdArchive"><li class="hint">Loading…</li></ul>
        </div>`,
  prose: `<h2>About the Word of the Day</h2>
<p>Each day at 00:00 UTC we pick one word that most people already know, and look at it a little more closely: what it means (sometimes more than one thing), how it's used in a sentence, and something about it that matters in word games, like an anagram hiding in its letters or a hook that turns it into a longer word. The words come from the ${ctx.fmt(ctx.wordPageWords.length)} common words that have their own <a href="/word">word pages</a>, so every Word of the Day links to a page with its anagrams, the words inside it and its rhymes.</p>
<p>The notes on meaning and usage are written for Letterpile and checked before they're published. The word-game fact is worked out from our word list, the same open list (ENABLE) all our tools use, so it's always accurate for that list.</p>
<h2>Why everyday words?</h2>
<p>Plenty of sites offer a rare word a day. Everyday words are more useful in the games most people play: they're the answers daily puzzles choose, the words you can actually play on a board without a challenge, and they often hold more surprises than you'd expect. A familiar word with an anagram you'd never spotted, or one that takes a hook on both ends, is worth knowing.</p>
<p>Missed a day? The last week's words are listed above. For more, browse the <a href="/lists">curated word lists</a> or try the <a href="/training">training drills</a>.</p>`,
});
