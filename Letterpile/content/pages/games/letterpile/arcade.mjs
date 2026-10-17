// Letterpile Arcade (/games/letterpile/arcade): a 6x6 pile, 8 words, as many points as possible;
// new letters fall in from the top. Local high score only.
import { lpTool } from "../letterpile.mjs";

export default ctx => ({
  key: "game-letterpile-arcade", section: "games", path: "/games/letterpile/arcade", file: "games/letterpile/arcade.html", type: "game", game: "letterpile", games: ["lp-engine", "letterpile"], og: "letterpile",
  title: "Letterpile Arcade: Score Big in Eight Words | Letterpile",
  description: "A 6×6 pile, eight words, as many points as you can. New letters tumble in from the top, and long words score far more. Beat your own high score.",
  h1: "Letterpile Arcade",
  crumbs: [{ name: "Home", path: "/" }, { name: "Daily Games", path: "/games" }, { name: "Letterpile", path: "/games/letterpile" }, { name: "Arcade", path: "/games/letterpile/arcade" }],
  tool: lpTool(ctx, "arcade"),
  prose: `<h2>How Arcade scoring works</h2>
<p>Arcade turns <a href="/games/letterpile">Letterpile</a> into a race for points. You get a 6×6 pile and eight words. Every tile you clear is replaced by a new letter falling in from the top, chosen at random but weighted towards common letters, so the pile never runs out. Long words are worth far more than short ones:</p>
<table><tr><th>Word length</th><th>Points</th></tr><tr><td>3 letters</td><td>10</td></tr><tr><td>4 letters</td><td>20</td></tr><tr><td>5 letters</td><td>40</td></tr><tr><td>6 letters</td><td>70</td></tr><tr><td>7 letters</td><td>110</td></tr><tr><td>8 letters</td><td>160</td></tr><tr><td>Each letter after 8</td><td>+60</td></tr></table>
<p>Your best score is kept in this browser. Arcade words can't be undone, so look before you leap: a short word that drops good letters into place can set up a long one.</p>
<p>The game ends after your eighth word, or sooner if no word can be traced anywhere on the board. Because fresh letters keep landing on top, a column never stays empty for long here; the real skill is reading which letters will tumble into the gaps a long word leaves behind.</p>`,
  related: [
    { href: "/games/letterpile", label: "Daily Letterpile" },
    { href: "/games/letterpile/practice", label: "Letterpile Practice" },
    { href: "/guides/letterpile", label: "Letterpile guide" },
  ],
});
