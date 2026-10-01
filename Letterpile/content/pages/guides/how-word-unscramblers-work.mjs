// Guide: How Word Unscramblers Work. Worked example computed by the engine at build time.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  const rack = "dgo";
  const plain = ctx.unscramble(rack);
  const withBlank = Engine.unscramble(rack + "?").map(x => x);
  const blankWords = withBlank.filter(x => x.blanks).map(x => x.word);
  const sig = w => [...w].sort().join("");
  ctx.assertWords(["dog", "god", "listen", "silent", "enlist", "tinsel", "inlets"]);
  const listenFamily = ctx.anagrams("listen").concat("listen").sort();
  const four = ctx.clean.filter(w => w.length === 4).length;
  return {
    key: "guide-unscramblers", path: "/guides/how-word-unscramblers-work", file: "guides/how-word-unscramblers-work.html", type: "guide",
    published: "2026-10-01",
    title: "How Word Unscramblers Work | Letterpile",
    description: "How an unscrambler turns jumbled letters into words: letter counts, blank tiles, and why it is fast.",
    h1: "How Word Unscramblers Work",
    prose: `<p class="summary">A word unscrambler doesn't shuffle your letters into every possible order. It does something simpler: it counts the letters you have, then keeps every word in its list that can be spelled with those counts. Blank tiles are spare counts that can stand for any letter. This guide walks through the idea with a small example, explains why the method is quick, and says what it can't do.</p>
<!--@slot after-intro-->
<h2>The obvious way, and why it's slow</h2>
<p>The first idea most people have is to rearrange the letters every possible way and look each arrangement up. With three letters there are only six orders, so that works. With seven distinct letters there are 5,040 orders for the full-length words alone, and you also want all the shorter words hiding inside the rack, which multiplies the work again. At ten or more letters the number of orders runs into the millions. Most of those arrangements are gibberish, so the time is spent checking strings that could never be words.</p>
<h2>The better way: count the letters</h2>
<p>An unscrambler turns the problem around. Instead of generating arrangements, it starts from the word list, which is finite, and asks one question about each word: <em>do I have enough of each letter to spell this?</em></p>
<p>To answer it, the tool counts your letters once. A rack of ${code("dgo")} becomes D×1, G×1, O×1. Then for each word in the list it walks through the word's letters and takes one from the matching count. If a count would go below zero, the word fails. If every letter is covered, the word goes into the results. The order of your letters never matters, because only the counts are used.</p>
<p>That is what Letterpile's <a href="/">Word Unscrambler</a> does: it runs this check over the whole word list in your browser. It needs no list of arrangements and no server, just the word list and a few counters.</p>
<h2>A worked example</h2>
<p>Take the letters ${code("dgo")}. Checking every word in the list against the counts D×1, G×1, O×1 gives ${fmt(plain.length)} words of two letters or more: ${ctx.list(plain, plain.length)}. Each uses each letter at most once, and they come back grouped by length, longest first.</p>
<p>A word like ${code("good")} fails, even though it uses only these letters, because it needs two O's and the rack has one. That is the counting rule doing its job.</p>
<h2>Blank tiles</h2>
<p>A blank, written as <kbd>?</kbd>, adds one wildcard to the counts. When the tool runs out of a letter while checking a word, it uses a wildcard instead, if one is left. Adding a single blank to ${code("dgo")} raises the result count to ${fmt(withBlank.length)}, and ${fmt(blankWords.length)} of those words need the blank, for example ${ctx.list(blankWords.filter(w => w.length === 4), 4)}. In the results, the letter supplied by the blank is marked, so you can see which tile you'd have to spend.</p>
<p>Blanks make the search wider quickly, which is why Letterpile allows at most three. Each one also needs a small rule: when a word could use the blank for more than one letter, the tool spends your real tiles first and uses the blank only for what is missing. That keeps the point values honest, since blanks score nothing in most tile games.</p>
<h2>Finding exact anagrams faster: sorted letters</h2>
<p>For “use every letter” searches there is an even quicker trick. Sort the letters of a word alphabetically and you get its <em>signature</em>: ${code("listen")} becomes ${code(sig("listen"))}. Every exact anagram has the same signature, so the words ${ctx.list(listenFamily, listenFamily.length)} all share ${code(sig("listen"))}.</p>
<p>If the tool builds a table that maps each signature to its words once, finding all anagrams of a set of letters is a single lookup: sort the letters, look up the signature. Letterpile's <a href="/anagram-solver">Anagram Solver</a> works this way, and builds the table the first time you use it in a session.</p>
<table>
<tr><th>Word</th><th>Signature</th></tr>
${listenFamily.map(w => `<tr><td>${code(w)}</td><td>${code(sig(w))}</td></tr>`).join("")}
</table>
<!--@slot mid-article-->
<h2>Filters</h2>
<p>Most unscramblers let you narrow results with filters such as “starts with”, “ends with”, “contains” or a fixed length. These are cheap extra checks applied to each candidate word before the letter counting, and they are useful when a word has to join letters already on a board. For example, there are ${fmt(four)} four-letter words in the list, but only a small fraction of them can be spelled from any particular rack, and a starts-with filter cuts that further.</p>
<h2>Why it can run in your browser</h2>
<p>The word list Letterpile uses is a plain text file of about ${fmt(ctx.total)} words. Compressed for download, it is small enough for a browser to fetch once and keep in its cache, and checking each word with a handful of counters is light work for a modern phone or computer. Running everything on your device has two benefits: results appear without a round trip to a server, and the letters you type are never sent anywhere.</p>
<h2>What an unscrambler can't tell you</h2>
<ul>
<li><b>Whether your game accepts a word.</b> The tool only knows its own list. ${ctx.WORDLIST_NOTE}</li>
<li><b>Which word is best on a board.</b> Bonus squares, crossing words and what you keep on your rack matter as much as the word itself. The <a href="/scrabble-word-finder">tile game word finder</a> adds letter scores and board letters, but not bonus squares.</li>
<li><b>Meanings.</b> A list of words is not a dictionary. Letterpile can look up a definition when you ask, from a separate service.</li>
</ul>
<h2>Summary</h2>
<p>An unscrambler counts your letters and keeps the words those counts can pay for. Blanks are spare counts. Exact anagrams can be found even faster by sorting letters into a signature. The method is simple, quick and private, and its answers are only as good as the word list behind it.</p>`,
    related: [
      { href: "/", label: "Word Unscrambler" },
      { href: "/anagram-solver", label: "Anagram Solver" },
      { href: "/guides/anagram-basics", label: "What Is an Anagram?" },
      { href: "/guides/word-lists-explained", label: "Word Lists Explained" },
    ],
  };
};
