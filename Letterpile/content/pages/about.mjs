// About. Truthful only: no invented team, address, story or credentials.
export default ctx => ({
  key: "about", path: "/about", file: "about.html", type: "trust",
  title: "About Letterpile | Letterpile",
  description: "What Letterpile is, how the tools work, which open word list powers them, credits, and how to report a problem.",
  h1: "About Letterpile",
  prose: `<p>Letterpile is a small, independent website of free word-game helper tools, run by ${ctx.site.operatorName} in ${ctx.site.country}. It has ten tools: a word unscrambler, a word scrambler, a word combiner, word finders for tile games and Words With Friends, a Wordle solver, an anagram solver, a jumble solver, a crossword pattern solver and a Text Twist and Wordscapes solver.</p>

<h2>How the tools work</h2>
<p>Every tool runs in your browser. When you first use one, your browser downloads the word list once (it is cached after that) and searches it on your own device. Nothing you type is sent to Letterpile. The unscrambler, for example, counts the letters you entered and keeps every word in the list that can be spelled from those counts, with blank tiles standing in for any letter. The Wordle solver turns your colored tiles into rules (this letter here, that letter somewhere else, no more than one of this letter) and keeps the words that pass all of them.</p>

<h2>The word list</h2>
<p>${ctx.WORDLIST_NOTE}</p>
<p>The list is ENABLE (“enable1”), which has ${ctx.fmt(ctx.total)} words. It was compiled by <b>M. Cooper and Alan Beale</b>, who released it into the public domain and asked to be credited as its originators. Read the <a href="/licenses/enable.txt">ENABLE README and licence text</a>. Letterpile claims no copyright in the word list and does not restrict its redistribution: the exact file the tools use is openly downloadable at <a href="${ctx.assets["words.js"]}">${ctx.assets["words.js"]}</a>. (The site's own code, design and text are separate and belong to the operator.)</p>
<p>Letterpile is not an official word source for any game, and it does not use any game publisher's dictionary. Different games accept different words: for example, <code>QI</code> and <code>ZA</code> are accepted by some games but are not in the list this site uses.</p>

<h2>Words hidden by default</h2>
<p>ENABLE includes vulgar words and slurs. The tools hide ${ctx.fmt(ctx.blockedCount)} of them by default (a “Show all words” switch brings them back), and pages that list words never show them. The hidden set is based on the English list from the <a href="https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words" rel="noopener">List of Dirty, Naughty, Obscene and Otherwise Bad Words</a> project, used under the <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener">Creative Commons Attribution 4.0</a> licence. Letterpile changed it: only single words are used, simple word endings are added, a few ordinary words are left visible, and a short list of its own is added.</p>

<h2>Other credits</h2>
<ul>
  <li>Definitions, when you ask for one, come from the <a href="https://dictionaryapi.dev/" rel="noopener">Free Dictionary API</a>.</li>
  <li>Hosting is provided by Cloudflare.</li>
</ul>

<h2>Trademarks</h2>
<p>${ctx.TRADEMARKS} Owners are named to the best of our knowledge.</p>

<h2>How this site is made</h2>
<p>Letterpile is a hand-built static website: plain HTML, CSS and a small amount of JavaScript, with no tracking. Its pages are generated from text and data files and checked by automated tests before they are published.</p>

<h2>Report a problem</h2>
<p>Found a wrong result, a broken page or a word you think should be hidden? Please <a href="/contact">get in touch</a>.</p>`,
});
