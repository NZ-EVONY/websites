// Guide: how cryptic crossword clues work, for beginners. Example clues are written for this site.
export default ctx => ({
  key: "guide-cryptic", path: "/guides/how-to-solve-cryptic-crosswords", file: "guides/how-to-solve-cryptic-crosswords.html", type: "guide",
  published: "2026-10-30",
  title: "How to Solve Cryptic Crosswords for Beginners | Letterpile",
  description: "How cryptic clues are built, the eight clue types you will meet most, common indicator words and a step-by-step way to crack your first grid.",
  h1: "How to Solve Cryptic Crosswords",
  prose: `<p class="summary">A cryptic crossword looks like nonsense until you learn that every clue follows the same hidden rule: it contains a plain definition of the answer, plus a second route to the same answer through wordplay. Once you can split a clue into those two parts, most of the mystery goes. This guide explains how clues are built, walks through the eight types you will meet most often with original examples, lists the signal words setters use, and gives a routine for getting started on a real grid.</p>
<!--@slot after-intro-->
<h2>The one rule behind every cryptic clue</h2>
<p>A fair cryptic clue has two parts that sit side by side, with no overlap:</p>
<ul>
<li><b>The definition.</b> An ordinary synonym or description of the answer, just like a quick crossword clue. It is almost always at the very start or the very end of the clue, never in the middle.</li>
<li><b>The wordplay.</b> A set of instructions that builds the answer another way: rearrange these letters, hide the word inside this phrase, join these pieces together, and so on.</li>
</ul>
<p>The surface reading, meaning what the clue appears to say as an English sentence, is designed to mislead you. A clue that seems to be about a cat at a party might be about neither. The skill is to ignore the story and read the clue as a machine: which end is the definition, and what are the rest of the words telling you to do?</p>
<p>The number in brackets is the answer's length. <code>(5)</code> means one five-letter word; <code>(3,4)</code> means two words of three and four letters; <code>(5-4)</code> means a hyphenated answer.</p>
<h2>The eight clue types you will meet most</h2>
<p>Each example below was written for this guide. The definition is in bold so you can see the split.</p>
<h3>1. Anagram</h3>
<p><i><b>Pay attention to</b> silent arrangement (6)</i>. The word "arrangement" signals that the letters of SILENT should be rearranged. They make LISTEN, which means "pay attention to". Anagrams are the friendliest type for beginners, because the letters you need are printed in the clue. Check that the letter count of the fodder matches the bracket; here both are six. If you have the letters but cannot see the word, an <a href="/anagram-solver">anagram solver</a> will list every word they make.</p>
<h3>2. Hidden word</h3>
<p><i>Some gold earrings are <b>precious</b> (4)</i>. "Some" tells you the answer is hidden in consecutive letters of the clue: gol<b>D EAR</b>rings gives DEAR. Hidden answers often span two words, so read across the gaps. Other indicators include "in", "part of", "held by", "within" and "partly".</p>
<h3>3. Charade</h3>
<p><i>Mate with top card makes <b>royal home</b> (6)</i>. A charade builds the answer from pieces placed one after another: a mate is a PAL, the top card is an ACE, and PAL + ACE = PALACE. Words like "with", "and", "by" or "after" glue the pieces together, or there may be no link word at all.</p>
<h3>4. Container and contents</h3>
<p><i>Pint takes in a <b>coat</b> (5)</i>. One piece goes inside another: PINT taking in A gives P-A-INT, PAINT, which as a verb means to coat. Indicators include "holding", "swallowing", "about", "keeping", "in" and "outside".</p>
<h3>5. Homophone</h3>
<p><i>Pair, we hear, for <b>fruit</b> (4)</i>. "We hear", "reportedly", "on the radio" and "say" tell you the answer sounds like another word: PAIR sounds like PEAR. Homophones depend on accent, and setters usually stick to sounds most English speakers share.</p>
<h3>6. Reversal</h3>
<p><i>Ward returns to <b>sketch</b> (4)</i>. "Returns" reverses WARD to make DRAW. In across clues, look for "back", "returning" or "about"; in down clues, setters often use "up", "rising" or "over", because the word reads upward in the grid.</p>
<h3>7. Initial letters</h3>
<p><i>Every animal ran towards home, initially, on this <b>planet</b> (5)</i>. "Initially" tells you to take the first letters: E, A, R, T, H gives EARTH. "Leaders", "heads", "at first" and "openers" work the same way. "Finally" or "ultimately" point to last letters instead.</p>
<h3>8. Deletion and double definition</h3>
<p><i>Bread loses its head to <b>study</b> (4)</i>. A deletion removes letters: BREAD without its first letter is READ. "Headless", "endless" and "heartless" remove the first, last and middle letters.</p>
<p>A double definition has no wordplay at all, just two definitions of the same word side by side: <i><b>Tree covering</b> a <b>dog makes</b> (4)</i> is BARK. These clues are short and often the hardest to see, because both halves look like a plain description.</p>
<h2>Common abbreviations setters rely on</h2>
<p>Setters turn ordinary words into one or two letters using a shared stock of abbreviations. A handful cover a surprising number of clues:</p>
<table>
<tr><th>In the clue</th><th>Often means</th></tr>
<tr><td>a, one, single</td><td>A or I</td></tr>
<tr><td>nothing, love, zero, ring</td><td>O</td></tr>
<tr><td>north, south, east, west</td><td>N, S, E, W</td></tr>
<tr><td>small, little</td><td>S</td></tr>
<tr><td>street, road</td><td>ST, RD</td></tr>
<tr><td>doctor</td><td>DR, MO or MB</td></tr>
<tr><td>sailor</td><td>AB or TAR</td></tr>
<tr><td>river</td><td>R</td></tr>
<tr><td>Roman numerals: five, ten, fifty, hundred</td><td>V, X, L, C</td></tr>
</table>
<p>Do not try to memorise a long list on day one. Notice them as you meet them in solutions, and they will stick.</p>
<h2>A routine for your first grid</h2>
<ol>
<li><b>Skim every clue once.</b> Look for the obvious signals first: "arrangement", "wild" or "broken" next to a word of the right length (anagram); "some" or "part of" (hidden word). These are the cheapest points on the board.</li>
<li><b>Test both ends.</b> For each clue, ask whether the first word or two, or the last word or two, could be the definition. Think of synonyms of the right length.</li>
<li><b>Use the crossers.</b> Every answer you enter gives letters to the clues it crosses. A pattern like <code>?A?A?E</code> narrows a six-letter answer a long way; you can try one in the <a href="/crossword-solver">crossword solver</a>, which lists words that fit a pattern of known letters.</li>
<li><b>Write the answer in, then justify it.</b> Many experienced solvers spot the answer from the definition and the crossers, then work back through the wordplay to confirm it. If the wordplay does not account for every letter, you have the wrong answer.</li>
<li><b>Check the solutions.</b> When you finish, or give up, read through the answers you missed and work out how each clue worked. This is where most of the learning happens.</li>
</ol>
<h2>Mistakes beginners make</h2>
<ul>
<li><b>Reading the clue as a sentence.</b> The surface story is a disguise. Break the clue into pieces and ignore what it seems to be about.</li>
<li><b>Looking for the definition in the middle.</b> It is at one end. If you cannot make either end work, the clue is probably a double definition.</li>
<li><b>Forgetting that every word matters.</b> In a fair clue there are no spare words except small link words such as "is", "for" or "makes". If a word is left over, your reading is not quite right.</li>
<li><b>Giving up too early.</b> Cryptic solving is a learned skill. Most people find their first few grids slow, and then something clicks. Finishing a handful of clues counts as progress.</li>
</ul>
<h2>How to practise</h2>
<p>A good way in is to keep your eye in with a regular quick crossword, where the clues are straight definitions, and add cryptic clues gradually. Letterpile's <a href="/games/crossword">Daily Crossword</a> uses plain clues, so it builds the vocabulary and the pattern-spotting that cryptic solving depends on; our guide to <a href="/guides/how-to-solve-crosswords">solving everyday crosswords</a> covers that side. Anagrams are the backbone of cryptic setting, so the <a href="/guides/anagram-basics">anagram basics guide</a> and the <a href="/games/letterpile">Letterpile game</a> are useful practice too. Most newspapers that run a cryptic publish the answers the next day: use them to learn how each clue worked, not just what the answer was.</p>`,
  related: [
    { href: "/games/crossword", label: "Daily Crossword" },
    { href: "/crossword-solver", label: "Crossword Solver" },
    { href: "/anagram-solver", label: "Anagram Solver" },
    { href: "/guides/anagram-basics", label: "Anagram Basics" },
  ],
});
