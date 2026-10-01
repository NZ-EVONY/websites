// Terms of Use. Good-faith template, not legal advice.
export default ctx => ({
  key: "terms", path: "/terms", file: "terms.html", type: "trust",
  title: "Terms of Use | Letterpile",
  description: "The terms for using Letterpile, including disclaimers, trademark notices and limits of liability.",
  h1: "Terms of Use",
  prose: `<p>These terms apply to your use of Letterpile (<a href="/">letterpile.app</a>), a free website of word-game helper tools run by ${ctx.site.operatorName}. By using the site you agree to them. If you don't agree, please don't use the site.</p>

<h2>Using the tools</h2>
<p>You may use the tools for any lawful personal or educational purpose, including while playing word games, as long as the rules of the game or competition you are playing allow outside help. Many games and clubs do not allow it during play; that is between you and the people you play with.</p>
<p>Please don't attempt to disrupt the site, overload it with automated requests, or copy the site's design and text and present them as your own.</p>

<h2>Accuracy and “as is”</h2>
<p>The tools are provided free, “as is” and “as available”, without warranties of any kind, express or implied, including fitness for a particular purpose. ${ctx.WORDLIST_NOTE} A word appearing in Letterpile's results only means it is in that list. It does not mean any game, club or publisher will accept it. Letter values and bonuses shown are commonly used values and may differ from your game's rules. Definitions come from a third-party service and may be missing or wrong.</p>

<h2>Limitation of liability</h2>
<p>To the fullest extent permitted by law, the operator is not liable for any loss or damage arising from your use of the site or from relying on its results, including lost games, points, prizes or wagers. Nothing in these terms limits any rights you have under consumer protection laws that cannot be excluded.</p>

<h2>Intellectual property</h2>
<p>The site's code, design and original text belong to the operator. The word list is the ENABLE list, which its compilers, M. Cooper and Alan Beale, released into the public domain; Letterpile claims no copyright in it, and you are free to download and redistribute it (see <a href="/about">About</a> and the <a href="/licenses/enable.txt">ENABLE licence text</a>).</p>
<p>${ctx.TRADEMARKS} All other trademarks belong to their owners, to the best of our knowledge as named here.</p>

<h2>Other websites and services</h2>
<p>The site links to, and on request uses, services run by others (such as the Free Dictionary API, Wiktionary and Merriam-Webster). Letterpile does not control them and is not responsible for their content or practices. See the <a href="/privacy-policy">Privacy Policy</a> for what is sent to them.</p>

<h2>Advertising</h2>
<p>The site may show ads in the future. Ads are provided by third parties; an ad appearing on the site is not an endorsement.</p>

<h2>Changes</h2>
<p>These terms may be updated from time to time. The “Last updated” date shows the latest version. Continuing to use the site after a change means you accept the updated terms.</p>

<h2>Governing law</h2>
<p>These terms are governed by the laws of ${ctx.site.governingLaw}. <!-- TODO-BEE: set governingLaw in site.config.json (default suggestion: New Zealand). --></p>

<h2>Contact</h2>
<p>Questions about these terms: <a href="mailto:${ctx.site.contactEmail}">${ctx.site.contactEmail}</a>.</p>`,
});
