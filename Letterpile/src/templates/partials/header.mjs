// Site header: brand, mobile menu button, theme toggle. Rendered into every page at build time.
export default function header() {
  return `<header class="masthead">
  <div class="wrap">
    <button class="menu-toggle" id="menuToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navbar"><span aria-hidden="true">☰</span></button>
    <a class="brand" href="/"><span class="brand-tiles" aria-hidden="true"><span>L</span><span>P</span><span>!</span></span>Letterpile</a>
    <button class="theme-toggle" id="themeToggle" type="button" aria-label="Dark mode" aria-pressed="false"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 2a8 8 0 0 1 0 16z" fill="currentColor"/></svg></button>
  </div>
</header>`;
}
