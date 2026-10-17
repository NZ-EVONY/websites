// Cryptogram Solver (substitution ciphers and codewords). The worked example is computed with the
// page's own search (src/assets/js/wordtools.js).
export default ctx => {
  const { code, fmt, WordTools: T } = ctx;
  const plain = "the early bird catches the worm but the second mouse gets the cheese";
  const shift = (s, k) => s.replace(/[a-z]/g, ch => String.fromCharCode((ch.charCodeAt(0) - 97 + k) % 26 + 97));
  const cipher = shift(plain, 7);
  const r = T.cryptogram(cipher);
  const decoded = cipher.replace(/[a-z]/g, ch => r.suggestion[ch] || "_");
  const wrong = decoded.split(" ").filter((w, i) => w !== plain.split(" ")[i]);
  const shape = T.shape("cheese");
  const sameShape = T.cryptogram(shift("cheese", 7)).words[0].total;
  return {
    key: "cryptogram", path: "/cryptogram-solver", file: "cryptogram-solver.html", type: "tool", script: "crypto", wordtools: true,
    title: "Cryptogram Solver: Substitution Cipher Helper | Letterpile",
    description: "Paste a cryptogram or codeword puzzle, fill in the letter key as you go, and see which words fit each cipher word. Suggests a full key.",
    h1: "Cryptogram Solver",
    lede: "Paste the puzzle, then fill in the key: each box says which real letter a cipher letter stands for. The decoded text updates as you type.",
    tool: `<form class="tool-form" id="form" autocomplete="off">
          <label class="field"><span>Cipher text</span><textarea id="cipher" rows="3" maxlength="600" placeholder="e.g. AOL LHYSF IPYK JHAJOLZ AOL DVYT"></textarea></label>
          <p class="hint"><b>Key</b> <small>(cipher letter → real letter; faded letters aren't in the puzzle)</small></p>
          <div class="wt-keys" id="key"></div>
          <p class="wt-plain" id="plain" aria-live="polite"></p>
          <div class="row"><button class="btn" type="submit">Show candidates</button><button class="btn secondary" type="button" id="suggest">Suggest a key</button><button class="btn secondary" type="button" id="clearKey">Clear key</button></div>
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Candidates for each cipher word appear here. “Suggest a key” fills in the rest of the key with the best fit it finds.</p></div>`,
    prose: `<p>A cryptogram is a short piece of text in which every letter has been swapped for another, the same way throughout: if K stands for E once, it stands for E everywhere, and no other letter stands for E. Codeword puzzles use numbers instead of letters but work the same way. You solve them by spotting patterns, guessing a word, and following the consequences. This page does the bookkeeping: you keep the key, it shows the decoded text, lists the real words that fit each cipher word, and can suggest a whole key.</p>
<h2>How to use it</h2>
<ol>
<li>Paste or type the puzzle. Capitals, punctuation and spaces are kept as they are.</li>
<li>Fill in the key as you work something out: under each cipher letter, type the real letter it stands for. A box turns red if two cipher letters point to the same real letter.</li>
<li>Press <b>Show candidates</b> to see, for every cipher word, the real words that fit its letter pattern and your key so far. Tap a candidate to put its letters into the key.</li>
<li>Press <b>Suggest a key</b> to let the solver fill in the empty boxes with the key that turns the most text into real words. Your own entries are kept.</li>
</ol>
<!--@slot after-intro-->
<h2>Letter patterns</h2>
<p>The most useful clue in a cryptogram is the pattern of repeated letters inside a word. ${code("cheese")} has the pattern ${code(shape)}: the third, fourth and sixth letters are the same, and the rest are all different. A cipher word always has exactly the same pattern as its answer, so the cipher word ${code(shift("cheese", 7))} could be ${code("cheese")}, but a six-letter cipher word with no repeated letters couldn't. The solver groups every word in its list by pattern, so it can list the candidates instantly: ${fmt(sameShape)} words share the pattern of ${code("cheese")}.</p>
<h2>A worked example</h2>
<p>Here is a proverb with every letter shifted seven places along the alphabet:</p>
<p>${code(cipher)}</p>
<p>With an empty key, <b>Suggest a key</b> decodes it as ${code(decoded)}. ${wrong.length ? `That's right except for ${wrong.map(w => code(w)).join(", ")}: the solver found real words that fit, but not the intended ones. Fixing one letter in the key and suggesting again finishes it. This is typical: the suggestion gets you most of the way, and your eye does the rest.` : "Every word comes out right, which is typical for a quote of a dozen words or more."}</p>
<h2>How the suggestion works</h2>
<p>The solver tries words for the cipher word with the fewest candidates first, then the next most constrained, keeping the key consistent at every step: no cipher letter can stand for two letters, and no real letter can be used twice. It scores each complete key by how many letters it explains with real words, giving extra weight to everyday words, and keeps the best one it finds within about a second and a half. Short puzzles have many possible keys, so for a quote of five words or fewer, treat the suggestion as one possibility among several. Words that are names or not in the list are left undecoded rather than forced.</p>
<h2>Tips for solving by hand</h2>
<ul>
<li><b>One-letter words</b> are almost always A or I.</li>
<li><b>Short common words</b>: three-letter cipher words that repeat are often THE or AND.</li>
<li><b>Apostrophes</b>: a single letter after an apostrophe is usually S or T; two letters are often RE, VE or LL.</li>
<li><b>Letter frequency</b>: in English text, E, T, A and O are the most common letters, so the most frequent cipher letters are good guesses for them. The key shows how often each cipher letter appears.</li>
</ul>
<!--@slot before-faq-->
<h2>Privacy</h2>
<p>Your puzzle and key stay in your browser. The address bar keeps the first 400 characters and the key so you can come back to a puzzle.</p>`,
    faq: [
      { q: "What kinds of puzzle does it handle?", a: "Any simple substitution cipher, where each letter always stands for the same other letter. For number codewords, write each number as a letter first." },
      { q: "Why does a key box turn red?", a: "Two cipher letters point to the same real letter, which a substitution cipher doesn't allow. One of them is wrong." },
      { q: "Why is the suggested key wrong for my short puzzle?", a: "Short texts often fit several keys equally well. Fill in one letter you're sure of and suggest again; each correct letter narrows the choice." },
      { q: "Can a letter stand for itself?", a: "In most published cryptograms, no letter stands for itself, but the solver doesn't assume that." },
      { q: "Does it handle names?", a: "Names usually aren't in the word list, so they get no candidates. The solver leaves them undecoded and works on the rest." },
      { q: "What does tapping a candidate do?", a: "It writes that word's letters into the key, so the decoded text and every other word's candidates update." },
    ],
    related: [
      { href: "/hangman-solver", label: "Hangman Solver" },
      { href: "/anagram-solver", label: "Anagram Solver" },
      { href: "/crossword-solver", label: "Crossword Solver" },
      { href: "/jumble-solver", label: "Jumble Solver" },
    ],
  };
};
