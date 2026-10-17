// Shared pieces for the curated list pages (content/pages/lists/). Every count shown comes from
// the visible ENABLE list in the same build; words with their own page link to it.
export function listKit(ctx) {
  const pages = new Set(ctx.wordPageWords);
  const link = w => (pages.has(w) ? `<a href="/word/${w}">${w}</a>` : w);
  const words = ws => `<p class="wordlist">${ws.map(link).join(" ")}</p>`;
  const byLength = (ws, label = n => `${n}-letter words`) => {
    const m = new Map();
    for (const w of ws) { if (!m.has(w.length)) m.set(w.length, []); m.get(w.length).push(w); }
    return [...m].sort((a, b) => a[0] - b[0]).map(([n, l]) => `<h3>${label(n)} <span class="count">${l.length.toLocaleString("en-US")}</span></h3>\n${words(l.sort())}`).join("\n");
  };
  const common = w => ctx.WordTools.tier(w) > 0;
  const crumbs = (name, path) => [{ name: "Home", path: "/" }, { name: "Word lists", path: "/lists" }, { name, path }];
  return { link, words, byLength, common, crumbs, visible: ctx.clean, fmt: ctx.fmt, code: ctx.code };
}
