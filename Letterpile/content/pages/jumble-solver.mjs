// Jumble Solver. Copy reused from the live page.
export default ctx => ({
  key: "jumble", path: "/jumble-solver", file: "jumble-solver.html", type: "tool", script: "jumble",
  title: "Jumble Solver: Solve Scrambled Words at Once | Letterpile",
  description: "Solve a whole jumble puzzle at once: enter each scrambled word, then get help with the final bonus phrase.",
  h1: "Jumble Solver",
  lede: "Enter each scrambled word from your puzzle, one per box. Every one is solved at once, then the circled letters can be worked on for the final answer.",
  tool: `<form class="tool-form" id="form" autocomplete="off">
          <div class="row" id="inputs"></div>
          <div class="row">
            <button class="btn" type="submit">Solve all</button>
            <button class="btn secondary" type="button" id="add">+ Add word</button>
            <button class="btn secondary" type="button" id="clear">Clear</button>
          </div>
          <label class="field mt"><span>Final puzzle letters (optional)</span>
            <input class="big-input" id="final" type="text" maxlength="18" placeholder="The circled letters"></label>
          ${ctx.showAllToggle}
        </form>
        <div class="results" id="results" aria-live="polite"><p class="empty">Answers will appear here, one group per scrambled word.</p></div>`,
  prose: `<h2>Solving a jumble</h2>
        <ol>
          <li>Type each scrambled word into its own box. Order doesn't matter.</li>
          <li>Press <b>Solve all</b>. Most jumble words have exactly one answer; where there are several, pick the one whose circled letters make sense.</li>
          <li>Collect the circled letters into <b>Final puzzle letters</b> for single-word and two-word answers to the cartoon's punchline. Longer punchlines usually need some human judgment, but the pairs are a strong head start.</li>
        </ol>
        <p>If a box shows no answer, check for a mistyped letter. Newspaper jumbles tend to use everyday words, so the answer is usually the most familiar word in the results.</p>`,
  sidebar: `<section class="panel tip"><h2>Tip</h2><p>Stuck on the punchline? Try pulling the most likely short word, like THE or AN, out of the final letters first, then solve what's left.</p></section>`,
});
