// Site header: brand, mobile menu button, theme toggle. Rendered into every page at build time.
export default function header() {
  return `<header class="masthead">
  <div class="wrap">
    <button class="menu-toggle" id="menuToggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="navbar"><span aria-hidden="true">☰</span></button>
    <a class="brand" href="/"><span class="brand-tiles" aria-hidden="true"><span>L</span><span>P</span><span>!</span></span>Letterpile</a>
    <button class="theme-toggle" id="themeToggle" type="button" aria-label="Dark mode" aria-pressed="false"><span aria-hidden="true">◐</span></button>
  </div>
</header>`;
}
