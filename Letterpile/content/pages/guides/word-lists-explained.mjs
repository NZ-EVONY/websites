// Guide: Word Lists Explained. Names other lexicons only to say Letterpile does not use them
// (this page is whitelisted for that in the banned-strings test).
export default ctx => {
  const { code, fmt } = ctx;
  const notIn = ["qi", "za", "ok", "ew"];
  ctx.assertNotWords(notIn);
  const two = ctx.clean.filter(w => w.length === 2).length;
  const five = ctx.clean.filter(w => w.length === 5).length;
  const maxLen = ctx.clean.reduce((m, w) => Math.max(m, w.length), 0);
  const longest = ctx.clean.filter(w => w.length === maxLen);
  return {
    key: "guide-lists", path: "/guides/word-lists-explained", file: "guides/word-lists-explained.html", type: "guide",
    published: "2026-10-01",
    title: "Word Lists Explained: Where Words Come From | Letterpile",
    description: "Why games accept different words, what ENABLE and other open word lists are, and why this site claims no official status.",
    h1: "Word Lists Explained",
    prose: `<p class="summary">Every word tool and word game relies on a list of words it treats as valid. Those lists are chosen by people, for different purposes, so they disagree, especially about short, informal, new and borrowed words. This guide explains what a word list is, which one Letterpile uses and why, and how to check whether your own game will accept a word. ${ctx.WORDLIST_NOTE}</p>
<!--@slot after-intro-->
<h2>A word list is not a dictionary</h2>
<p>A dictionary explains words: meanings, pronunciations, origins. A word list for games is simply a set of spellings that count. It usually has no definitions, no capitalized words (names and places are left out), no hyphens or spaces, and it includes all the inflected forms a game needs, such as plurals and verb endings. That is why a list can contain a word that you won't find as a headword in a dictionary: it may be a plural, or a form a dictionary lists under its base word.</p>
<h2>The list Letterpile uses: ENABLE</h2>
<p>Letterpile uses ENABLE (often distributed as <code>enable1.txt</code>). It was compiled by M. Cooper and Alan Beale and released into the public domain, with a request that users credit them as its originators and don't restrict its redistribution. Their README describes it as an alternative to “official” word lists for word game players and designers. You can read the <a href="/licenses/enable.txt">ENABLE README and licence text</a> on this site.</p>
<p>The copy Letterpile ships has ${fmt(ctx.total)} words, all lowercase letters A to Z, from two letters up to ${longest[0].length} (the longest ${longest.length > 1 ? "are" : "is"} ${ctx.list(longest, 3)}). Of those, ${fmt(two)} have two letters and ${fmt(five)} visible words have five. Letterpile hides some vulgar words and slurs by default; the tools have a switch to show them, and the word list file itself is unchanged and free to download (see <a href="/about">About</a>).</p>
<h2>Why Letterpile switched lists</h2>
<p>Until recently the site used a larger list that came from a software package. The package itself had a clear licence, but the origin of the list inside it could not be traced to a clearly licensed source. ENABLE's public-domain release is documented, so the site moved to it. The change removed many obscure words and some short ones that returning visitors may miss, such as ${code("qi")} and ${code("za")}.</p>
<!--@slot mid-article-->
<p>Because the list is just spellings, it carries no information about how common a word is. A tool built on it can tell you that a word exists in the list, but not whether most people would recognize it.</p>
<h2>Why games disagree</h2>
<ul>
<li><b>Different purposes.</b> A list for casual players may leave out obscure words; a list for competitive play may include as many as possible.</li>
<li><b>Different regions.</b> British and American spellings differ (colour and color), and some lists include both while others pick one.</li>
<li><b>Different dates.</b> Language keeps changing. Newer lists add slang and borrowings; older lists, like ENABLE, don't have them.</li>
<li><b>Different policies.</b> Some games remove offensive words; some keep them because they are part of the language.</li>
</ul>
<p>The result is that the same letters can be a word in one game and not in another. None of ${notIn.map(code).join(", ")} is in ENABLE, for example, although some games accept some of them.</p>
<h2>Other lists you may hear about</h2>
<p>Competitive tile games in North America and elsewhere use their own lexicons, maintained by word game organizations and publishers, often referred to by abbreviations such as NWL or CSW (the latter associated with Collins). Those lists are not public domain, and Letterpile does not use them. If you play in a club or tournament, its rules will say which list applies.</p>
<p>Other open lists exist too. SCOWL, by Kevin Atkinson, is a family of English word lists organized by how common words are; it is a possible alternative if ENABLE ever stopped being suitable.</p>
<h2>What “valid” means on Letterpile</h2>
<p>When a Letterpile tool shows a word, it means one thing only: the word is in the ENABLE list (and not hidden). It does <b>not</b> mean the word is accepted by any particular game, and nothing on this site is an official word source for any game. Letter values and bonuses shown are commonly used values, not any game's rulebook.</p>
<h2>How to check a word for your game</h2>
<ol>
<li>Look for a word checker in the game itself. Many apps reject invalid words before you play them.</li>
<li>Check the game's rules or help pages, which often name the dictionary used.</li>
<li>For club or tournament play, use the word judge or adjudication tool the organizers specify.</li>
<li>Use Letterpile to find candidates, then confirm them with your game.</li>
</ol>
<h2>Summary</h2>
<p>A word list is a set of accepted spellings chosen for a purpose. Letterpile uses ENABLE, an open, public-domain list compiled by M. Cooper and Alan Beale. Games use their own lists, which can differ in either direction, so the safest habit is to treat any tool's answer as a suggestion and check it against your game.</p>`,
    related: [
      { href: "/about", label: "About Letterpile" },
      { href: "/guides/two-letter-words", label: "Two-Letter Words" },
      { href: "/words-by-length", label: "Words by Length" },
      { href: "/guides/how-word-unscramblers-work", label: "How Word Unscramblers Work" },
    ],
  };
};
