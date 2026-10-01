// Sidebar: the "Word tools" list (was injected by site.js) plus page-specific panels.
import { esc } from "./util.mjs";

export default function sidebar({ nav, page }) {
  const cur = n => (n.key === page.key ? ' aria-current="page"' : "");
  return `<aside class="sidebar" id="sidebar">
  <section class="panel">
    <h2>Word tools</h2>
    <ul>${[...nav.main, ...nav.more].map(n => `<li><a href="${n.href}"${cur(n)}><span class="ico" aria-hidden="true">${esc(n.icon)}</span>${esc(n.label)}</a></li>`).join("")}</ul>
  </section>
  ${page.sidebar || ""}
</aside>`;
}
