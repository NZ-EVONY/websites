// Site header (the navy "stage"): brand tiles, mobile menu button, main navigation and the
// theme toggle. Rendered into every page at build time.
export default function header({ navHtml = "" } = {}) {
  return `<header class="masthead">
  <div class="wrap">
    <a class="brand" href="/"><span class="brand-tiles" aria-hidden="true"><span class="tile c-coral">L</span><span class="tile c-sun">P</span><span class="tile c-blue">!</span></span>Letterpile</a>
    <button class="icon-btn menu-toggle" id="menuToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navbar"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 22 22"><path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>
    ${navHtml}
    <button class="icon-btn theme-toggle" id="themeToggle" type="button" aria-label="Dark mode" aria-pressed="false"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 2a8 8 0 0 1 0 16z" fill="currentColor"/></svg></button>
  </div>
</header>`;
}
