// Hub: /games. Rendered late so it only lists game pages that were built. The cards' status
// and the last week's archive links are filled in by games/hub.js from saved progress.
import { gameCards, GAME_INFO } from "../../src/templates/partials/game-cards.mjs";

export const late = true;
export default ctx => {
  const built = href => ctx.pages.some(p => p.path === href);
  const count = GAME_INFO.filter(g => !g.feature && built(g.href)).length;
  return {
    key: "games", path: "/games", file: "games.html", type: "games", games: ["hub"], og: "games",
    title: "Daily Games: Letterpile, Word, Search, Sudoku | Letterpile",
    description: "Free puzzles that change every day at midnight UTC: Letterpile, our own pile-of-letters game, plus a five-letter word game, a word search and a sudoku.",
    h1: "Daily Games",
    prose: `<p>${["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven"][count] || count} free puzzle${count === 1 ? "" : "s"}, new every day at 00:00 UTC. Your progress is saved in this browser, so you can stop and come back later. Next puzzles in <time data-countdown>--:--:--</time>.</p>
<div class="all-games" data-all-games><p><b>Today:</b> <span data-done>0</span> of <span data-total>${count}</span> games finished</p><div class="meter" aria-hidden="true"><span data-meter></span></div><p>All-games streak: <b data-streak>0</b> day<span data-streak-s>s</span> in a row with every game finished · best <b data-best>0</b></p></div>
${gameCards({ built, heading: "h2" })}
<p>Also new every day: the <a href="/word-of-the-day">Word of the Day</a>, an everyday word with its meaning and a fact for word games.</p>
<h2>Missed a day?</h2>
<p>You can play the last ${7} days' puzzles from the archive. Archive games don't count towards your Daily Word streak.</p>
<div class="game-archive" data-archive><p class="hint">The archive needs JavaScript.</p></div>
<h2>How the daily puzzles work</h2>
<p>Every puzzle is made ahead of time and checked before it goes on the site: each sudoku is confirmed to have exactly one solution, every word in the word search appears exactly once, and every crossword entry crosses another word. The day changes at midnight UTC for everyone, wherever you are, so friends in different time zones play the same puzzles. That is around midday in New Zealand, and the afternoon or evening before in the Americas. If you leave a game open across midnight UTC, a banner tells you new puzzles are ready.</p>
<p>Nothing you type is sent anywhere. Your progress, times and Daily Word statistics stay in this browser's local storage; clearing your browsing data resets them. The <a href="/privacy-policy">Privacy Policy</a> lists exactly what is stored.</p>`,
    related: [
      { href: "/wordle-solver", label: "Wordle Solver" },
      { href: "/crossword-solver", label: "Crossword Solver" },
      { href: "/guides/solve-daily-word-puzzles", label: "Solving Daily Word Puzzles" },
    ],
  };
};
