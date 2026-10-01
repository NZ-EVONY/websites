// Not-found page, served with status 404 by Cloudflare (not_found_handling: "404-page").
export default ctx => ({
  key: "404", path: "/404", file: "404.html", type: "error", noindex: true, showUpdated: false, inSitemap: false,
  title: "Page Not Found | Letterpile",
  description: "That page doesn't exist on Letterpile. Try one of the word tools instead.",
  h1: "Page not found",
  prose: `<p>Sorry, there's nothing at this address. It may have been mistyped, or the page may have moved.</p>
<h2>Try one of these</h2>
<ul>${[...ctx.nav.main, ...ctx.nav.more].map(n => `<li><a href="${n.href}">${ctx.esc(n.label)}</a></li>`).join("")}</ul>
<p>Or read <a href="/about">about Letterpile</a>.</p>`,
});
