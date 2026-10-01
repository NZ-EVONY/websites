// Prose similarity between pages: 5-word shingles, Jaccard index.
// Word lists, tables, link lists, the shared footer/header and the FAQ/related wrappers'
// headings are excluded, so the score reflects the written copy.
// { count: true } keeps headings and tables (used for word counts); the default drops them
// too (used for similarity, where shared table headers and headings would add noise).
export function proseText(html, { count = false } = {}) {
  let main = (html.match(/<main[\s\S]*?<\/main>/) || [html])[0];
  if (count) main = main.replace(/<\/?(table|tr|td|th|h[1-6])[^>]*>/g, " ");
  return main
    .replace(/<nav class="crumbs"[\s\S]*?<\/nav>/g, " ")
    .replace(/<div class="panel tool-card">[\s\S]*?<\/form>/g, " ")
    .replace(/<p class="wordlist">[\s\S]*?<\/p>/g, " ")
    .replace(/<table[\s\S]*?<\/table>/g, " ")
    .replace(/<ul class="(link-cols|related-list)">[\s\S]*?<\/ul>/g, " ")
    .replace(/<section class="related"[\s\S]*?<\/section>/g, " ")
    .replace(/<p class="updated">[\s\S]*?<\/p>/g, " ")
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g, " ")
    .replace(/<script[\s\S]*?<\/script>|<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ")
    .toLowerCase().replace(/[^a-z0-9%.' -]+/g, " ").replace(/\s+/g, " ").trim();
}
export const wordCount = text => (text ? text.split(" ").filter(w => /[a-z0-9]/.test(w)).length : 0);

export function shingles(text, n = 5) {
  const w = text.split(" ").filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}

// For each page, the highest Jaccard index against any other page (inverted index; fast).
export function maxSimilarity(pages) {
  const sets = pages.map(p => shingles(proseText(p.html)));
  const index = new Map();
  sets.forEach((s, i) => { for (const sh of s) { if (!index.has(sh)) index.set(sh, []); index.get(sh).push(i); } });
  return sets.map((s, i) => {
    const shared = new Map();
    for (const sh of s) for (const j of index.get(sh)) if (j !== i) shared.set(j, (shared.get(j) || 0) + 1);
    let best = 0, with_ = null;
    for (const [j, c] of shared) { const jac = c / (s.size + sets[j].size - c); if (jac > best) { best = jac; with_ = j; } }
    return { page: pages[i].url, max: best, with: with_ == null ? null : pages[with_].url };
  });
}
