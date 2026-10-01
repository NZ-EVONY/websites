// HTML site map (/sitemap). Rendered last: lists every indexable page by section.
export const late = true;
export default ctx => {
  const pages = ctx.pages.filter(p => !p.noindex);
  const by = t => pages.filter(p => p.type === t);
  const sorted = list => list.slice().sort((a, b) => a.path.localeCompare(b.path, "en", { numeric: true }));
  const link = p => `<li><a href="${p.path}">${p.h1}</a></li>`;
  const fam = f => sorted(pages.filter(p => (p.type === "programmatic" || p.type === "affix") && p.path.startsWith(f)));
  const lists = [["/words-by-length/", "Words by length"], ["/words-starting-with/", "Words starting with"], ["/words-ending-in/", "Words ending in"]];
  return {
    key: "sitemap", path: "/sitemap", file: "sitemap.html", type: "utility", showUpdated: false,
    title: "Site Map | Letterpile",
    description: "Every page on Letterpile: word tools, guides, word list pages and site information, in one place.",
    h1: "Site map",
    prose: `<p>Every page on Letterpile, grouped by section. The word list pages are long, so they are grouped by type; each group starts with its overview page.</p>
<h2>Word tools</h2>
<ul class="link-cols">${by("tool").map(link).join("")}</ul>
<h2>Guides</h2>
<ul><li><a href="/guides">All guides</a></li>${sorted(by("guide")).map(link).join("")}</ul>
<h2>About this site</h2>
<ul>${["/about", "/contact", "/privacy-policy", "/terms"].map(p => link(pages.find(x => x.path === p))).join("")}</ul>
${lists.map(([prefix, name]) => `<h2>${name}</h2>
<p><a href="${prefix.slice(0, -1)}">${name}: overview</a></p>
<ul class="link-cols">${fam(prefix).map(link).join("")}</ul>`).join("\n")}`,
    wordsListed: null,
  };
};
