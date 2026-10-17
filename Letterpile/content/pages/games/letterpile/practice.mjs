// Letterpile Practice (/games/letterpile/practice): unlimited clearable piles from the same
// generator as the daily game, with par shown. Nothing is saved.
import { lpTool } from "../letterpile.mjs";

export default ctx => ({
  key: "game-letterpile-practice", section: "games", path: "/games/letterpile/practice", file: "games/letterpile/practice.html", type: "game", game: "letterpile", games: ["lp-engine", "letterpile"], og: "letterpile",
  title: "Letterpile Practice: Unlimited Letter Piles | Letterpile",
  description: "Practice Letterpile with unlimited new piles. Every pile can be cleared; par shows the target. Try strategies without spoiling your daily result.",
  h1: "Letterpile Practice",
  crumbs: [{ name: "Home", path: "/" }, { name: "Daily Games", path: "/games" }, { name: "Letterpile", path: "/games/letterpile" }, { name: "Practice", path: "/games/letterpile/practice" }],
  tool: lpTool(ctx, "practice"),
  prose: `<h2>About Practice mode</h2>
<p>Practice deals a fresh 5×5 pile whenever you press <b>New board</b>. Each pile comes from the same generator as the <a href="/games/letterpile">daily Letterpile</a>: it's built backwards from common words, so it can always be cleared, and par is the number of words it was built from. Practice games aren't saved and don't affect your daily streak, so this is the place to try a new idea, like saving long words for last or clearing the bottom row first.</p>
<p>Hints work the same way as in the daily game: each one lights up the first tile of a word that helps clear the pile. The <a href="/guides/letterpile">Letterpile guide</a> has strategy tips and worked examples.</p>`,
  related: [
    { href: "/games/letterpile", label: "Daily Letterpile" },
    { href: "/games/letterpile/arcade", label: "Letterpile Arcade" },
    { href: "/guides/letterpile", label: "Letterpile guide" },
  ],
});
