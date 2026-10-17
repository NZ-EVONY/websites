// Training (/training): two- and three-letter word quizzes, timed anagram drills and Q-without-U
// flashcards, with progress saved in the browser. The word lists are embedded (computed from the
// visible ENABLE list); the drills check words with the site's search worker.
export default ctx => {
  const { fmt, code, esc } = ctx;
  const T = ctx.WordTools;
  const two = ctx.clean.filter(w => w.length === 2), three = ctx.clean.filter(w => w.length === 3);
  const noU = ctx.clean.filter(w => /q(?!u)/.test(w));
  // Drill racks: everyday 7-letter words whose letters make plenty of words.
  const racks = ctx.clean.filter(w => w.length === 7 && T.tier(w) === 2 && new Set(w).size >= 6).filter((w, i) => i % 3 === 0);
  const sample = ctx.unscramble("retains").filter(w => w.length >= 3);
  const data = esc(JSON.stringify({ two, three, noU, racks }));
  ctx.assertNotWords(["qi", "za"]);
  return {
    key: "training", path: "/training", file: "training.html", type: "tool", script: "training",
    title: "Word Game Training: Quizzes and Drills | Letterpile",
    description: "Learn the two- and three-letter words, drill anagrams against the clock and memorize the Q-without-U words, with your progress saved in your browser.",
    h1: "Word Game Training",
    lede: "Pick a drill. Your progress is saved in this browser, so you can come back and pick up where you left off.",
    tool: `<div class="train" id="train" data-train="${data}">
          <div class="row train-tabs" role="tablist" aria-label="Drills">
            <button type="button" class="btn secondary small" role="tab" aria-selected="true" aria-controls="t-two" id="tab-two">Two-letter quiz</button>
            <button type="button" class="btn secondary small" role="tab" aria-selected="false" aria-controls="t-three" id="tab-three">Three-letter quiz</button>
            <button type="button" class="btn secondary small" role="tab" aria-selected="false" aria-controls="t-anagram" id="tab-anagram">Anagram drill</button>
            <button type="button" class="btn secondary small" role="tab" aria-selected="false" aria-controls="t-q" id="tab-q">Q without U</button>
          </div>
          <section class="train-pane" id="t-two" role="tabpanel" aria-labelledby="tab-two" data-quiz="two">
            <p class="train-q">Is <span class="train-word" data-word-shown>…</span> a word?</p>
            <div class="row"><button type="button" class="btn" data-answer="yes">Yes, it's a word</button><button type="button" class="btn secondary" data-answer="no">No</button></div>
            <p class="train-feedback" role="status" aria-live="polite" data-feedback></p>
            <p class="hint" data-progress>Mastered 0 of ${fmt(two.length)}.</p>
          </section>
          <section class="train-pane" id="t-three" role="tabpanel" aria-labelledby="tab-three" data-quiz="three" hidden>
            <p class="train-q">Is <span class="train-word" data-word-shown>…</span> a word?</p>
            <div class="row"><button type="button" class="btn" data-answer="yes">Yes, it's a word</button><button type="button" class="btn secondary" data-answer="no">No</button></div>
            <p class="train-feedback" role="status" aria-live="polite" data-feedback></p>
            <p class="hint" data-progress>Mastered 0 of ${fmt(three.length)}.</p>
          </section>
          <section class="train-pane" id="t-anagram" role="tabpanel" aria-labelledby="tab-anagram" hidden>
            <p class="train-rack" id="anRack" aria-label="Your rack">· · · · · · ·</p>
            <div class="row"><button type="button" class="btn" id="anStart">Start a 60-second drill</button><span class="pill" id="anClock">1:00</span><span class="pill" id="anScore">0 words</span></div>
            <form class="row" id="anForm" autocomplete="off"><input type="text" class="big-input grow" id="anInput" maxlength="7" placeholder="Type a word and press Enter" aria-label="Your word" disabled><button class="btn secondary" type="submit" id="anAdd" disabled>Add</button></form>
            <p class="train-feedback" role="status" aria-live="polite" id="anFeedback"></p>
            <div id="anFound" class="words"></div>
            <div id="anResult"></div>
            <p class="hint" id="anBest">Best score: none yet.</p>
          </section>
          <section class="train-pane" id="t-q" role="tabpanel" aria-labelledby="tab-q" hidden>
            <div class="train-card" id="qCard"><p class="train-word" id="qFront">…</p><p class="hint" id="qHint"></p></div>
            <div class="row"><button type="button" class="btn" id="qFlip">Show the word</button><button type="button" class="btn secondary" id="qKnew" disabled>I knew it</button><button type="button" class="btn secondary" id="qMissed" disabled>I didn't</button></div>
            <p class="hint" id="qProgress">Known 0 of ${fmt(noU.length)}.</p>
          </section>
          <p class="row"><button type="button" class="btn secondary small" id="trainReset">Reset my progress</button></p>
        </div>`,
    prose: `<p>Strong word-game players aren't born with bigger vocabularies. They've drilled the small set of words that come up again and again: the two-letter words that let you play alongside other words, the three-letter words that fill tight gaps, the handful of words that use a Q without a U, and the habit of spotting every word in a rack quickly. These four drills cover exactly that, using the same open word list (ENABLE) as all our tools.</p>
<h2>The drills</h2>
<ul>
<li><b>Two-letter quiz.</b> You're shown a pair of letters and asked whether it's a word. Half the time it is; the rest are look-alikes that aren't. A word counts as mastered after three right answers in a row, and the quiz keeps returning to the ones you haven't mastered. There are ${fmt(two.length)} to learn.</li>
<li><b>Three-letter quiz.</b> The same idea with the ${fmt(three.length)} three-letter words. This is the long game: most players learn them over weeks, a few at a time.</li>
<li><b>Anagram drill.</b> You get seven letters and 60 seconds to type as many words as you can make from them, of three letters or more. When time's up you see how many you found out of how many were possible, and the longest ones you missed. From ${code("retains")}, for example, there are ${fmt(sample.length)} words to find.</li>
<li><b>Q without U.</b> Flashcards for the ${fmt(noU.length)} words in our list where Q isn't followed by U. Each card shows the word's letters shuffled; try to name the word, then flip the card and mark whether you knew it.</li>
</ul>
<!--@slot after-intro-->
<h2>How to practice well</h2>
<p>A little every day beats a long session once a week. Five minutes of the two-letter quiz with your morning coffee will have you knowing them all in a couple of weeks. Mix the drills: the quizzes build recognition, while the anagram drill builds the speed that matters with a game clock running.</p>
<p>Say words out loud, or picture them on a board, as you answer. Words are easier to remember when you can see where you'd play them. If a word keeps catching you out, look it up: tap it after the quiz tells you the answer and the word window shows its points and hooks, with a link to its definition.</p>
<h2>Your progress</h2>
<p>Progress is stored only in this browser's local storage: which words you've mastered, your known flashcards and your best anagram score. Nothing is sent anywhere. Clearing your browsing data, or pressing <b>Reset my progress</b>, starts you over.</p>
<h2>Which words count</h2>
<p>All drills use the ENABLE word list without its hidden words (vulgar words and slurs). Tournament and app dictionaries differ slightly: some games accept two-letter words that ENABLE doesn't have, such as ${code("qi")} and ${code("za")}, so check your own game's list for those.</p>
<!--@slot before-faq-->
<h2>Where to go next</h2>
<p>The <a href="/guides/two-letter-words">two-letter words guide</a> explains what the odd ones mean, <a href="/guides/words-with-q-without-u">Words with Q and no U</a> covers when to play them, and <a href="/guides/anagram-basics">Anagram basics</a> has techniques for spotting words in a rack.</p>`,
    faq: [
      { q: "How is a word counted as mastered?", a: "After three correct answers in a row about it. Get it wrong once and the count starts again." },
      { q: "Are the wrong options real words in other games?", a: "They're letter pairs and triples that aren't in the ENABLE list. A few might be accepted by another game's dictionary." },
      { q: "How is the anagram drill scored?", a: "One point per word found, from three letters up. The total possible is every word in the list that can be made from the seven letters." },
      { q: "Where is my progress saved?", a: "Only in this browser's local storage. It isn't sent anywhere, and it doesn't follow you to another device." },
      { q: "Why aren't QI and ZA in the two-letter quiz?", a: "They aren't in the ENABLE list this site uses, though some games accept them." },
      { q: "Can I reset my progress?", a: "Yes. Press “Reset my progress” below the drills." },
    ],
    related: [
      { href: "/guides/two-letter-words", label: "Two-letter words guide" },
      { href: "/lists/two-and-three-letter-words", label: "Two- and three-letter words" },
      { href: "/guides/anagram-basics", label: "Anagram basics" },
      { href: "/anagram-solver", label: "Anagram Solver" },
    ],
  };
};
