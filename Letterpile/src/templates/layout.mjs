// Page layout. Everything a crawler or a no-JS visitor needs (header, navigation,
// page text, footer links) is in this HTML; scripts only add interactivity.
import { esc } from "./partials/util.mjs";
import header from "./partials/header.mjs";
import nav from "./partials/nav.mjs";
import sidebar from "./partials/sidebar.mjs";
import footer from "./partials/footer.mjs";
import breadcrumbs from "./partials/breadcrumbs.mjs";
import jsonld from "./partials/jsonld.mjs";
import adSlot from "./partials/ad-slot.mjs";
import cmpSlot from "./partials/cmp-slot.mjs";
import adsenseSlot from "./partials/adsense-slot.mjs";

// The only inline script (its SHA-256 goes into the CSP). Runs before first paint:
// applies the saved theme, and marks query-string URLs (shared results) noindex and
// hides ad slots on them.
export const HEAD_SCRIPT = `(function(d){try{var t=localStorage.getItem("theme");if(t)d.dataset.theme=t}catch(e){}if(location.search){d.classList.add("has-query");var m=document.createElement("meta");m.name="robots";m.content="noindex, follow";document.head.appendChild(m)}})(document.documentElement);`;

export default function layout(page, ctx) {
  const { site, assets, ads } = ctx;
  const canonical = site.siteUrl + (page.path === "/" ? "/" : page.path);
  const slotsOn = ads.enabledFor(page);
  const slot = name => (slotsOn.includes(name) ? adSlot(name, { dev: ads.dev }) : "");
  const scripts = [];
  if (page.script) {
    scripts.push(`<script src="${assets["engine.js"]}" data-words="${assets["words.js"]}" data-worker="${assets["worker.js"]}" defer></script>`);
  }
  scripts.push(`<script src="${assets["site.js"]}" defer></script>`);
  if (page.script) scripts.push(`<script src="${assets[`js/${page.script}.js`]}" defer></script>`);

  // Ad slots are placed with <!--@slot NAME--> markers in the copy; "before-faq" is added
  // automatically above the FAQ when the copy has no marker for it.
  const fill = html => html.replace(/<!--@slot ([a-z-]+)-->/g, (_, n) => slot(n));
  const faq = page.faq?.length ? `${/<!--@slot before-faq-->/.test(page.prose) ? "" : slot("before-faq")}
      <section class="faq" aria-labelledby="faq-title">
        <h2 id="faq-title">Frequently asked questions</h2>
        ${page.faqIntro ? `<p>${page.faqIntro}</p>` : ""}
        ${page.faq.map(f => `<details class="faq-item"><summary>${f.q}</summary><div class="faq-a">${f.a}</div></details>`).join("\n        ")}
      </section>` : "";
  const related = page.related?.length ? `<section class="related" aria-labelledby="related-title">
        <h2 id="related-title">Related tools and guides</h2>
        <ul>${page.related.map(r => `<li><a href="${r.href}">${esc(r.label)}</a>${r.note ? ` <span class="hint">${r.note}</span>` : ""}</li>`).join("")}</ul>
      </section>` : "";
  const updated = page.updated && page.showUpdated !== false ? `<p class="updated">Last updated: <time datetime="${page.updated}">${ctx.longDate(page.updated)}</time></p>` : "";
  // The home page puts its tool in the navy "stage" hero; results, the home sections and the
  // copy follow full width (the ten-tool grid replaces the sidebar's tool list there).
  const heroMain = page.hero ? `<main class="home" id="main">
  <section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        ${page.hero.eyebrow ? `<p class="eyebrow"><i></i>${page.hero.eyebrow}</p>` : ""}
        <h1 class="page-title">${esc(page.h1)}</h1>
        ${page.lede ? `<p class="lede">${page.lede}</p>` : ""}
        ${page.tool}
        ${page.hero.facts?.length ? `<ul class="facts">${page.hero.facts.map(f => `<li>${f}</li>`).join("")}</ul>` : ""}
      </div>
      ${page.hero.pile || ""}
    </div>
  </section>
  <div class="wrap home-body">
    <section class="panel results-panel" aria-label="Results">
      ${page.results}
    </section>
    ${page.extras || ""}
    <div class="home-copy">
      <article class="prose">
        ${fill(page.prose)}
        ${faq}
        ${related}
        ${updated}
      </article>
      <div class="home-aside" id="sidebar">${page.sidebar || ""}</div>
    </div>
  </div>
</main>` : "";
  const main = page.type === "tool"
    ? `<div class="panel tool-card">
        <h1 class="page-title">${esc(page.h1)}</h1>
        ${page.lede ? `<p class="lede">${page.lede}</p>` : ""}
        ${page.tool}
      </div>
      <article class="prose">
        ${fill(page.prose)}
        ${faq}
        ${related}
        ${updated}
      </article>`
    : `<article class="panel prose doc${page.type === "programmatic" || page.type === "affix" ? " wide" : ""}">
        <h1 class="page-title">${esc(page.h1)}</h1>
        ${updated}
        ${fill(page.prose)}
        ${faq}
        ${related}
      </article>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${canonical}">
${page.noindex ? `<meta name="robots" content="noindex, follow">\n` : ""}<meta property="og:type" content="${page.type === "guide" ? "article" : "website"}">
<meta property="og:site_name" content="${esc(site.brand)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="${site.themeColorLight}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${site.themeColorDark}" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script>${HEAD_SCRIPT}</script>
<link rel="stylesheet" href="${assets["style.css"]}">
${cmpSlot()}
${adsenseSlot()}
${jsonld({ page, site })}
${scripts.join("\n")}
</head>
<body data-page="${esc(page.key)}"${page.scheme ? ` data-scheme="${page.scheme}"` : ""}>
<a class="skip" href="#main">Skip to content</a>
${header({ navHtml: nav({ nav: ctx.nav, page }) })}
${page.hero ? heroMain : `<div class="layout wrap">
  <main class="content" id="main">
    ${breadcrumbs(page.crumbs)}
    ${main}
  </main>
  ${sidebar({ nav: ctx.nav, page })}
</div>`}
${footer({ nav: ctx.nav, site, year: ctx.year })}
</body>
</html>
`;
}
