// Curated word lists hub (/lists). Rendered late so it can describe the list pages.
export const late = true;
export default ctx => {
  const lists = ctx.pages.filter(p => p.type === "list").sort((a, b) => a.h1.localeCompare(b.h1));
  return {
    key: "lists", path: "/lists", file: "lists.html", type: "hub",
    title: "Curated Word Lists for Word Games | Letterpile",
    description: "Hand-picked word lists for word games: words with Q, Z, X and J, words without vowels, high-scoring short words, double letters and more.",
    h1: "Curated word lists",
    prose: `<p>Our <a href="/words-by-length">word list pages</a> cover every word by length, first letter and ending. These curated lists answer the narrower questions that come up mid-game: which words can I make with a Q but no U, what are the short words that score big, which five-letter words have a TH in them. Each list is computed from the same open word list (ENABLE) as our tools, with vulgar words left out, and each opens with a short explanation of when it's useful.</p>
<ul class="link-cols">${lists.map(p => `<li><a href="${p.path}">${p.h1}</a></li>`).join("")}</ul>
<h2>Which list do I need?</h2>
<ul>
<li><b>Stuck with a heavy tile:</b> the Q, Z, X and J lists, shortest words first.</li>
<li><b>A rack of consonants:</b> words without vowels.</li>
<li><b>Chasing points with few tiles:</b> high-scoring short words, and the two- and three-letter words.</li>
<li><b>Guessing a five-letter word:</b> words grouped by letter pair, and words with double letters.</li>
</ul>
<p>Lists here differ from the word list pages in two ways. They cut across length and position: a list of words with X includes three-letter words and twelve-letter words alike. And they're selective where a full list would bury the useful words, keeping, for example, every Z word of seven letters or fewer but only the everyday longer ones, or only the very common words with a doubled letter. Each page says exactly what it includes and gives the full count, so you know what's been left out.</p>
<p>All counts and examples on these pages are worked out from the word list each time the site is built, so they always match what the tools find. If a list looks short, that's usually because the word list is a game list, not a full dictionary: names, abbreviations and most capitalized words aren't in it.</p>
<p>Every word that has a page of its own links to it, with its anagrams, hooks and rhymes. For any other word, use <a href="/word">word lookup</a>. The <a href="/guides">guides</a> explain the strategy behind these lists in more depth.</p>`,
    related: [{ href: "/word", label: "Word pages" }, { href: "/guides", label: "Guides" }, { href: "/words-by-length", label: "Words by length" }, { href: "/", label: "Word Unscrambler" }],
  };
};
