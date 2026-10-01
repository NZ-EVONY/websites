// Word Combiner. Copy reused from the live page and expanded; examples computed.
export default ctx => {
  const { code, fmt, Engine } = ctx;
  ctx.assertWords(["brunch", "breakfast", "lunch", "smog", "smoke", "fog", "motor", "hotel", "spoon", "fork"]);
  const r1 = Engine.combine(["breakfast", "lunch"]);
  const real1 = r1.blends.filter(b => b.real).map(b => b.word);
  const r2 = Engine.combine(["spoon", "fork"]);
  const fresh2 = r2.blends.filter(b => !b.real).slice(0, 5).map(b => b.word);
  const r3 = Engine.combine(["motor", "hotel"]);
  const has3 = r3.blends.some(b => b.word === "motel");
  return {
    key: "combiner", path: "/word-combiner", file: "word-combiner.html", type: "tool", script: "combiner",
    title: "Word Combiner: Blend Words into New Ones | Letterpile",
    description: "Combine two to four words into blends like breakfast + lunch = brunch. Handy for names, usernames and puns.",
    h1: "Word Combiner",
    lede: "Feed it two to four words and it splices them together every sensible way. Blends that turn out to be words in the list float to the top.",
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row" id="inputs">
            <label class="field"><span>Word 1</span><input type="text" class="w" maxlength="40" value="breakfast" required></label>
            <label class="field"><span>Word 2</span><input type="text" class="w" maxlength="40" value="lunch" required></label>
          </div>
          <div class="row">
            <button class="btn" type="submit">Combine</button>
            <button class="btn secondary" type="button" id="add">+ Add word</button>
          </div>
          ${ctx.showAllToggle}
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Press <b>Combine</b> to blend the words above. With the example words, one of the blends is <b>brunch</b>.</p></div>`,
    prose: `<p>A blend, sometimes called a portmanteau, joins the start of one word to the end of another, like breakfast and lunch making brunch. The combiner does that mechanically for any two to four words you give it. It tries every split that keeps a recognizable piece of each word, throws out results nobody could pronounce, and sorts what's left: blends that happen to be words already, then invented blends, then the words simply joined. It's a brainstorming tool for names, handles, puns and games.</p>
<!--@slot after-intro-->
<h2>How blends are built</h2>
<p>For each pair of words, the combiner takes the start of one and the end of the other: <b>br</b>eakfast + l<b>unch</b> gives <b>brunch</b>, <b>sm</b>oke + f<b>og</b> gives <b>smog</b>. It keeps at least a fifth of each word, so both sources are still recognizable, and it drops anything that has no vowel or stacks up four consonants. With three or four words it blends every pair, in both orders.</p>
<p>Results come in three piles:</p>
<ul>
<li><b>Blends that are already words</b>: splices that land on a word in the ENABLE list, sometimes the famous one.</li>
<li><b>New blends</b>: invented words, most balanced first. This is where names come from.</li>
<li><b>Joined</b>: the words simply stuck together in every order.</li>
</ul>
<h2>How to use it</h2>
<ol>
<li>Type two words. Use <b>+ Add word</b> for up to four.</li>
<li>Press <b>Combine</b>.</li>
<li>Scan the new blends for ones that sound right when said aloud; the top of the list keeps the two halves most evenly.</li>
<li>Copy the link from your address bar to share the results.</li>
</ol>
<h2>Worked examples</h2>
<ul>
<li>${code("breakfast")} + ${code("lunch")} gives ${fmt(r1.blends.length)} blends, of which ${fmt(real1.length)} are already words in the list: ${ctx.list(real1, real1.length)}.</li>
<li>${code("spoon")} + ${code("fork")} gives new blends such as ${ctx.list(fresh2, 5)}. (The familiar “spork” is invented, so it appears among the new blends rather than as a listed word.)</li>
<li>${code("motor")} + ${code("hotel")}: ${has3 ? `the blend ${code("motel")} is among the results` : "the expected blend is filtered out by the rules above"}.</li>
</ul>
<h2>Reading the results</h2>
<p>Blends that are words in the list are clickable, so you can check a definition. New blends and joined forms are plain text. The new-blend list shows the first 150.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Expecting meaning.</b> The combiner blends spelling only. It doesn't know what words mean, so results are for fun and idea-sparking.</li>
<li><b>Using very short words.</b> Two- or three-letter words leave little to keep from each side. Longer words give more interesting splices.</li>
<li><b>Assuming a blend is available as a name.</b> Check trademarks and domain names yourself before using a blend for a business.</li>
</ul>
<h2>Limits</h2>
<p>Only the letters A to Z are used. The pronounceability check is a simple rule about vowels and consonant clusters, so some odd results slip through and some good ones are dropped. ${ctx.WORDLIST_NOTE}</p>
<h2>Privacy</h2>
<p>The words you enter are combined in your browser and not sent to Letterpile. They do appear in the page address so you can share a result.</p>
<h2>Ideas</h2>
<p>Business and product names, pet names, usernames, couple names, fantasy creatures, and puns for group chats. Try your two names, or two things your product does.</p>`,
    faq: [
      { q: "What is a portmanteau word?", a: "A word made by blending parts of two others, keeping the sound or sense of both, such as brunch from breakfast and lunch." },
      { q: "Why are some blends marked as real words?", a: "If a blend happens to be spelled like a word in the ENABLE list, it's listed first. That doesn't mean the word has anything to do with your inputs." },
      { q: "Can I combine more than two words?", a: "Yes, up to four. Every pair is blended, in both orders." },
      { q: "Why don't I see a blend I expected?", a: "The combiner keeps at least a fifth of each word and drops blends with no vowel or with four consonants in a row. Your blend may break one of those rules." },
      { q: "Can I use these blends as a business name?", a: "The tool only suggests spellings. Check trademarks and availability yourself before using any name." },
    ],
    related: [
      { href: "/word-scrambler", label: "Word Scrambler" },
      { href: "/anagram-solver", label: "Anagram Solver" },
      { href: "/guides/hooks-prefixes-and-suffixes", label: "Hooks, Prefixes and Suffixes" },
      { href: "/", label: "Word Unscrambler" },
    ],
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Short, punchy blends usually come from pairing a word's first syllable with the other word's last one. Check the top of <b>New blends</b>.</p></section>`,
  };
};
