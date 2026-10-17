// Offline page (/offline): shown by the service worker when a page that isn't saved on this
// device is opened without a connection. Not indexed.
export default ctx => ({
  key: "offline", path: "/offline", file: "offline.html", type: "utility", noindex: true, showUpdated: false,
  title: "You're Offline | Letterpile",
  description: "This page isn't saved on your device yet. The word tools and today's daily games still work offline.",
  h1: "No connection",
  prose: `<p>This page hasn't been saved on this device yet, so it can't open without a connection. Pages you've visited before, the word tools and the daily games work offline once Letterpile has been opened online, along with the next week of daily puzzles.</p>
<ul class="link-cols">${[...ctx.nav.main, ...ctx.nav.more].map(n => `<li><a href="${n.href}">${ctx.esc(n.label)}</a></li>`).join("")}<li><a href="/games">Daily Games</a></li></ul>`,
});
