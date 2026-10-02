// Home page sections between the tool and the copy: category cards, the ten-tool grid,
// A-Z tiles, how it works and three guide cards. Every number comes from ctx (the word list
// and the engine's letter values); the guide titles and summaries come from the guide pages.
import { esc, tile, tileColor } from "./util.mjs";

// One-line descriptions for the tool grid (copy, keyed by URL).
const TOOL_BLURB = {
  "/": "Find every word hiding in your letters",
  "/word-scrambler": "Scramble words, sentences or paragraphs",
  "/word-combiner": "Blend two to four words into one",
  "/scrabble-word-finder": "Playable words ranked by letter score",
  "/words-with-friends": "High-scoring plays for your tiles",
  "/wordle-solver": "Which five-letter words still fit",
  "/anagram-solver": "Single and two-word anagrams",
  "/jumble-solver": "Solve a whole jumble puzzle at once",
  "/crossword-solver": "Fill the gaps with ? for unknown letters",
  "/text-twist-solver": "Every word in your letter wheel",
};

export default function homeExtras({ ctx, guides }) {
  const { fmt, Engine } = ctx;
  const values = Engine.SCHEMES.scrabble.values;
  const t = (letter, color, size) => tile(letter, { color, size, value: values[letter.toLowerCase()] });
  const tools = [...ctx.nav.main, ...ctx.nav.more];
  for (const n of tools) if (!TOOL_BLURB[n.href]) throw new Error(`home tool grid has no description for ${n.href}`);
  const toolCount = tools.length;

  // Words per first letter, from the visible list (the same list the /words-starting-with pages use).
  const counts = new Map();
  for (const w of ctx.clean) counts.set(w[0], (counts.get(w[0]) || 0) + 1);
  const letters = [..."abcdefghijklmnopqrstuvwxyz"].filter(l => counts.get(l));

  const cats = [
    { color: "c-coral", letter: "W", title: "Word finders", href: "#tools", text: `Unscramble, solve and combine. ${toolCount} free tools for tile games, Wordle, jumbles and crosswords.`, mini: ["Unscrambler", "Wordle", "Anagram", "Crossword"], go: "Open the tools" },
    { color: "c-sun", letter: "S", title: "Starts with", href: "/words-starting-with", text: "Every word that begins with a letter or a prefix like un-, re- or pre-.", mini: ["A to Z", "un-", "re-", "pre-"], go: "Browse by first letter" },
    { color: "c-blue", letter: "E", title: "Ends with", href: "/words-ending-in", text: "Plurals, past tenses and suffixes such as -ing, -ed and -ly.", mini: ["A to Z", "-ing", "-ed", "-ly"], go: "Browse by last letter" },
    { color: "c-mint", letter: "C", title: "Contains", href: "/words-by-length", text: "Use the Contains filter in any finder for letters hiding inside a word, like qu or ing, or browse every word by length.", mini: ["qu", "ing", "by length"], go: "Browse by length" },
    { color: "c-violet", letter: "G", title: "Guides", href: "/guides", text: "Plain-English guides to anagrams, two-letter words, rack balance and Wordle logic.", mini: ["Anagrams", "Two-letter words", "Wordle"], go: "Read the guides" },
  ];

  return `<section class="section" aria-labelledby="cats-h">
      <h2 id="cats-h">Pick your game</h2>
      <p class="section-lede">Find words from your letters, browse every word by how it starts or ends, or learn the tricks behind the tiles.</p>
      <ul class="cats">${cats.map(c => `<li class="cat ${c.color}"><div class="top">${t(c.letter, c.color, "lg")}<h3><a href="${c.href}">${esc(c.title)}</a></h3></div><p>${esc(c.text)}</p><ul class="mini" aria-label="Examples">${c.mini.map(m => `<li>${esc(m)}</li>`).join("")}</ul><span class="go" aria-hidden="true">${esc(c.go)} →</span></li>`).join("")}</ul>
    </section>
    <section class="section" id="tools" aria-labelledby="tools-h">
      <h2 id="tools-h">All ${toolCount} word tools</h2>
      <p class="section-lede">Every tool runs in your browser, so results appear as soon as the word list has loaded.</p>
      <ul class="tools">${tools.map((n, i) => `<li><a class="tool" href="${n.href}">${tile(n.icon, { color: tileColor(i), size: "md" })}<span><strong>${esc(n.label)}</strong><small>${esc(TOOL_BLURB[n.href])}</small></span></a></li>`).join("")}</ul>
    </section>
    <section class="section" aria-labelledby="az-h">
      <h2 id="az-h">Browse by first letter</h2>
      <p class="section-lede">Pick a letter to see every word that starts with it. The small number is how many words there are.</p>
      <ul class="az">${letters.map(l => `<li><a href="/words-starting-with/${l}">${l.toUpperCase()}<small> ${fmt(counts.get(l))}<span class="sr-only"> words</span></small></a></li>`).join("")}</ul>
    </section>
    <section class="section" aria-labelledby="how-h">
      <h2 id="how-h">How it works</h2>
      <ol class="steps">
        <li>${tile("1", { color: "c-coral", size: "md" })}<div><h3>Type your letters</h3><p>Up to 15, with <kbd>?</kbd> for each blank tile.</p></div></li>
        <li>${tile("2", { color: "c-sun", size: "md" })}<div><h3>Press Unscramble</h3><p>Words appear grouped by length, longest first.</p></div></li>
        <li>${tile("3", { color: "c-blue", size: "md" })}<div><h3>Tap any word</h3><p>See its points and, if you want, look up a definition.</p></div></li>
      </ol>
    </section>
    <section class="section" aria-labelledby="guides-h">
      <h2 id="guides-h">Fresh from the guides</h2>
      <ul class="guide-cards">${guides.map(g => `<li><h3><a href="${g.path}">${esc(g.h1)}</a></h3><p>${esc(g.description)}</p></li>`).join("")}</ul>
      <a class="more-link" href="/guides">All guides →</a>
    </section>`;
}
