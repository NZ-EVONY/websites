// Visible breadcrumb trail; the BreadcrumbList JSON-LD is built from the same items.
import { esc } from "./util.mjs";

export default function breadcrumbs(items) {
  if (!items || items.length < 2) return "";
  return `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map((c, i) => i === items.length - 1
    ? `<li><span aria-current="page">${esc(c.name)}</span></li>`
    : `<li><a href="${c.path}">${esc(c.name)}</a></li>`).join("")}</ol></nav>`;
}
