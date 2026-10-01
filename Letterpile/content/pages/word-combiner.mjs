// Word Combiner. Copy reused from the live page.
export default ctx => {
  ctx.assertWords(["brunch", "breakfast", "lunch", "smog", "smoke", "fog"]);
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
    prose: `<h2>How blends are built</h2>
        <p>For each pair of words, the combiner takes the start of one and the end of the other: <b>br</b>eakfast + l<b>unch</b> gives <b>brunch</b>, <b>sm</b>oke + f<b>og</b> gives <b>smog</b>. It keeps at least a fifth of each word, so both sources are still recognizable, and it drops anything that has no vowel or stacks up four consonants.</p>
        <p>Results come in three piles:</p>
        <ul>
          <li><b>Blends that are already words</b>: splices that land on a word in the ENABLE list, sometimes the famous one.</li>
          <li><b>New blends</b>: invented words, most balanced first. This is where names come from.</li>
          <li><b>Joined</b>: the words simply stuck together in every order.</li>
        </ul>
        <p>The combiner works on spelling only. It does not know what words mean, so results are for fun and idea-sparking.</p>
        <h2>Ideas</h2>
        <p>Business and product names, pet names, usernames, couple names, fantasy creatures, and puns for group chats. Try your two names, or two things your product does.</p>`,
    sidebar: `<section class="panel tip"><h2>Tip</h2><p>Short, punchy blends usually come from pairing a word's first syllable with the other word's last one. Check the top of <b>New blends</b>.</p></section>`,
  };
};
