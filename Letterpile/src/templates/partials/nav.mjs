// Main navigation with the "More Word Games" dropdown. The dropdown is a native
// <details> element, so it works without JavaScript; site.js only closes it on
// outside click and Escape.
import { esc } from "./util.mjs";

export default function nav({ nav, page }) {
  const cur = n => (n.key === page.key ? ' aria-current="page"' : "");
  const inMore = nav.more.some(n => n.key === page.key);
  return `<nav class="navbar" id="navbar" aria-label="Word tools">
  <ul class="nav-main wrap">
    ${nav.main.map(n => `<li><a href="${n.href}"${cur(n)}>${esc(n.label)}</a></li>`).join("\n    ")}
    <li class="has-dropdown">
      <details id="moreMenu"${inMore ? ' class="active"' : ""}>
        <summary>More Word Games<span class="caret" aria-hidden="true"></span></summary>
        <ul class="dropdown">
          ${nav.more.map(n => `<li><a href="${n.href}"${cur(n)}>${esc(n.label)}</a></li>`).join("\n          ")}
        </ul>
      </details>
    </li>
  </ul>
</nav>`;
}
