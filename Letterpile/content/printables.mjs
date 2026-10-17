// Shared pieces for the printables pages: a ready-made word search per level for the theme pages,
// built with the same core as the daily game (src/assets/games/ws-core.js) from a fixed seed, so
// the page is the same on every build.
import { createRequire } from "node:module";
import { themes } from "../scripts/games/wordsearch.mjs";
import { rng } from "../scripts/games/util.mjs";

const WS = createRequire(import.meta.url)("../src/assets/games/ws-core.js");
export const LEVEL_NAMES = { kids: "Kids", teens: "Teens", adults: "Adults" };
export const themeList = () => themes();

export function readyMade(ctx, themeName, slug) {
  const theme = themes().find(t => t.name === themeName);
  if (!theme) throw new Error(`printables: no theme "${themeName}"`);
  return Object.keys(WS.LEVELS).map(level => {
    const p = WS.printable(rng(`printable:${slug}:${level}`), theme, level, ctx.blocked, 400);
    if (!p) throw new Error(`printables: couldn't build the ${level} ${themeName} word search`);
    return p;
  });
}

// The puzzle as an HTML table plus its word list, and the data the PDF button needs.
export function puzzleBlock(ctx, p) {
  let rows = "";
  for (let r = 0; r < p.size; r++) rows += `<tr>${[...p.grid.slice(r * p.size, r * p.size + p.size)].map(ch => `<td>${ch.toUpperCase()}</td>`).join("")}</tr>`;
  return `<section class="pz-ready" data-puzzle="${ctx.esc(JSON.stringify(p))}">
<h2>${LEVEL_NAMES[p.level]}: ${p.size} × ${p.size}, ${p.words.length} words</h2>
<table class="pz-grid pz-${p.size}" aria-label="${ctx.esc(p.theme)} word search for ${LEVEL_NAMES[p.level].toLowerCase()}">${rows}</table>
<p class="wordlist">${p.words.map(w => w.w.toLowerCase()).join(" ")}</p>
<p><button type="button" class="btn" data-download>Download PDF with answer key</button></p>
</section>`;
}
