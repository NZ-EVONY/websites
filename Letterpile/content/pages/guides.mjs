// Hub: /guides. Rendered late so it can list every guide with its summary.
export const late = true;
const GROUPS = [
  ["How the tools work", ["/guides/how-word-unscramblers-work", "/guides/anagram-basics", "/guides/word-lists-explained"]],
  ["Tile games", ["/guides/letter-values-and-tile-counts", "/guides/rack-balance", "/guides/high-value-letters-j-q-x-z", "/guides/hooks-prefixes-and-suffixes"]],
  ["Word lists to learn", ["/guides/two-letter-words", "/guides/words-with-q-without-u", "/guides/words-without-vowels"]],
  ["Daily word puzzles", ["/guides/wordle-strategy", "/guides/solve-daily-word-puzzles"]],
];
const BLURB = {
  "/guides/how-word-unscramblers-work": "Letter counts, blank tiles and sorted-letter signatures: the simple ideas that make an unscrambler fast.",
  "/guides/anagram-basics": "Perfect and partial anagrams, phrase anagrams, how common they are in the word list, and tricks for spotting them.",
  "/guides/word-lists-explained": "What a game word list is, why Letterpile uses the public-domain ENABLE list, and how to check a word for your own game.",
  "/guides/letter-values-and-tile-counts": "The commonly used letter values and 100-tile set, compared with how often each letter really appears.",
  "/guides/rack-balance": "Why a mix of vowels and consonants gives more options, shown with real counts, plus rules of thumb for what to keep.",
  "/guides/high-value-letters-j-q-x-z": "How rare J, Q, X and Z are, the shortest words that use them, and when to hold or play them.",
  "/guides/hooks-prefixes-and-suffixes": "Single-letter hooks, common prefixes and suffixes, and how they create extra plays on a board.",
  "/guides/two-letter-words": "Every two-letter word in the list this site uses, with short meanings and which familiar ones are missing.",
  "/guides/words-with-q-without-u": "The complete, short list of words with a Q and no U, what they mean and where they come from.",
  "/guides/words-without-vowels": "Words with no A, E, I, O or U, the even shorter list without Y, and why such words exist.",
  "/guides/wordle-strategy": "Letter frequencies in five-letter words, position patterns, repeated letters and a worked example.",
  "/guides/solve-daily-word-puzzles": "A step-by-step method: turn feedback into rules, track eliminated letters, and know when to probe.",
};
export default ctx => {
  const guides = new Map(ctx.pages.filter(p => p.type === "guide").map(p => [p.path, p]));
  for (const [, paths] of GROUPS) for (const p of paths) if (!guides.has(p)) throw new Error(`guides hub lists ${p}, which was not built`);
  for (const p of guides.keys()) if (!Object.values(GROUPS).some(([, ps]) => ps.includes(p))) throw new Error(`guide ${p} is missing from the guides hub`);
  return {
    key: "hub-guides", path: "/guides", file: "guides.html", type: "hub",
    title: "Word Game Guides and Word List Explainers | Letterpile",
    description: "Plain-English guides to anagrams, two-letter words, letter values, rack balance, Wordle logic and how word lists work.",
    h1: "Guides",
    prose: `<p>These guides explain the ideas behind Letterpile's tools and the word games they help with. Each one is written for this site, uses examples checked against the word list the tools use, and links to the tools it discusses. Numbers in the guides, such as how many two-letter words there are, are counted from that list when the site is built, so they always match what the tools show. ${ctx.WORDLIST_NOTE}</p>
<!--@slot after-intro-->
${GROUPS.map(([name, paths]) => `<h2>${name}</h2>
<ul class="guide-list">${paths.map(p => `<li><a href="${p}">${guides.get(p).h1}</a><br><span class="hint">${BLURB[p]}</span></li>`).join("")}</ul>`).join("\n")}
<h2>Word list pages</h2>
<p>Besides the guides, the site has browsable word lists: <a href="/words-by-length">words by length</a>, <a href="/words-starting-with">words starting with</a> a letter or prefix, and <a href="/words-ending-in">words ending in</a> a letter or suffix. Each list page adds facts worked out from its own words, such as the longest entry and the most common neighboring letters.</p>
<h2>A note on accuracy</h2>
<p>Where a guide gives advice about play, it is offered as a rule of thumb, not a guarantee. Where it gives a fact about words, the fact comes from the ENABLE word list, not from any game's own dictionary. Letter values and bonuses are the commonly used ones, and games can differ. If you spot something wrong, please <a href="/contact">let us know</a>.</p>`,
    related: [
      { href: "/", label: "Word Unscrambler" },
      { href: "/wordle-solver", label: "Wordle Solver" },
      { href: "/words-by-length", label: "Words by Length" },
      { href: "/sitemap", label: "Site map" },
    ],
  };
};
