// Printables (/printables): word searches and sudoku made in the browser and downloaded as a
// two-page PDF (puzzle and answer key). See src/assets/js/printables.js.
import { themeList } from "../printables.mjs";

export const late = true; // links the theme pages
export default ctx => {
  const themes = themeList();
  const pages = ctx.pages.filter(p => p.type === "printable").sort((a, b) => a.h1.localeCompare(b.h1));
  return {
    key: "printables", path: "/printables", file: "printables.html", type: "hub", plain: ["games/ws-core", "games/sd-core", "js/printables"],
    title: "Free Printable Word Searches and Sudoku | Letterpile",
    description: `Make a free printable word search (${themes.length} themes, three age levels) or sudoku (easy to hard) and download it as a PDF with the answer key.`,
    h1: "Printable puzzles",
    prose: `<div class="pz-maker" data-printables data-themes="${ctx.assets["games/ws-themes.json"]}" data-jspdf="${ctx.assets["jspdf/jspdf.umd.min.js"]}">
<form class="tool-form" id="pzForm" autocomplete="off">
  <fieldset class="row"><legend>Puzzle</legend>
    <label class="check"><input type="radio" name="kind" value="wordsearch" checked> Word search</label>
    <label class="check"><input type="radio" name="kind" value="sudoku"> Sudoku</label>
  </fieldset>
  <div class="row" id="pzWs">
    <label class="field grow2"><span>Theme</span><select id="pzTheme">${themes.map(t => `<option>${ctx.esc(t.name)}</option>`).join("")}</select></label>
    <label class="field"><span>Age level</span><select id="pzLevel"><option value="kids">Kids (10 × 10)</option><option value="teens" selected>Teens (15 × 15)</option><option value="adults">Adults (20 × 20)</option></select></label>
  </div>
  <div class="row" id="pzSd" hidden>
    <label class="field"><span>Difficulty</span><select id="pzDifficulty"><option value="easy">Easy</option><option value="medium" selected>Medium</option><option value="hard">Hard</option></select></label>
  </div>
  <label class="check"><input type="checkbox" checked disabled> Classroom-safe: rude words are always left out, in the word lists and in the filler letters</label>
  <div class="row"><button class="btn" type="submit">Make puzzle</button><button class="btn secondary" type="button" id="pzDownload" disabled>Download PDF</button></div>
</form>
<p class="hint" id="pzStatus" role="status" aria-live="polite">Your puzzle will appear here.</p>
<div class="pz-preview" id="pzPreview"></div>
</div>
<p>Make a fresh puzzle, check it on screen, and download it as a PDF: the puzzle on the first page and the answer key on the second, ready for a printer, a classroom or a long car trip. Every puzzle is new each time you press <b>Make puzzle</b>, built in your browser by the same code that makes our <a href="/games/wordsearch">Daily Word Search</a> and <a href="/games/sudoku">Daily Sudoku</a>, and checked the same way before you see it.</p>
<h2>Word searches</h2>
<p>Choose from ${themes.length} themes and three age levels. <b>Kids</b> puzzles use a 10 × 10 grid, short single words and only three directions: across, down and diagonally down. <b>Teens</b> puzzles are 15 × 15 with six directions, including some backward words. <b>Adults</b> puzzles are 20 × 20 with words in all eight directions, like the daily game. Every word appears exactly once, so there's never an argument about which one counts.</p>
<h2>Sudoku</h2>
<p>Easy puzzles can be finished by filling in squares where only one digit fits. Medium puzzles need a little more thought about where a digit can go in a box, row or column, and hard ones need pairs and triples of candidates. Each puzzle has exactly one solution, checked by a solver before it's shown.</p>
<h2>For teachers and parents</h2>
<p>Rude words are always kept out: they're never in the word lists, and the random letters that fill a word search are checked so none can be read in any direction. There's no setting to turn this off. The PDFs carry a small letterpile.app credit at the foot of the page and nothing else, and nothing you make is sent anywhere: the puzzle and the PDF are created on your own device.</p>
<h2>Ready-made theme pages</h2>
<p>Each theme page below has three word searches ready to print, one for each age level.</p>
<ul class="link-cols">${pages.map(p => `<li><a href="${p.path}">${p.h1}</a></li>`).join("")}</ul>`,
    related: [{ href: "/games/wordsearch", label: "Daily Word Search" }, { href: "/games/sudoku", label: "Daily Sudoku" }, { href: "/training", label: "Word Game Training" }, { href: "/lists", label: "Curated word lists" }],
  };
};
