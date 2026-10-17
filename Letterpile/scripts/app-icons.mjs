// Renders the installable-app icons (PNG) into src/assets/icons/: 192 and 512 px, a maskable
// 512 px version with a safe margin, and the 180 px Apple touch icon. The build copies them to
// public/icons/. Run after changing the design: node scripts/app-icons.mjs  (needs Chromium)
import fs from "node:fs";
import path from "node:path";
import { findChrome } from "./chrome.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "src/assets/icons");
fs.mkdirSync(OUT, { recursive: true });
const html = (size, pad) => `<!doctype html><html><head><style>
body{margin:0;width:${size}px;height:${size}px;background:#0A1030;display:grid;place-items:center;font-family:"DejaVu Sans",Arial,sans-serif}
.p{display:grid;grid-template-columns:1fr 1fr;gap:${size * 0.04}px;width:${size * (1 - pad * 2)}px}
.t{display:grid;place-items:center;aspect-ratio:1;border-radius:18%;color:#0A1030;font-weight:800;font-size:${size * (1 - pad * 2) * 0.28}px;box-shadow:inset 0 -${size * 0.025}px 0 rgb(0 0 0/.18)}
</style></head><body><div class="p"><span class="t" style="background:#FF7A5C">L</span><span class="t" style="background:#FFCC33">P</span><span class="t" style="background:#5C9DFF">!</span><span class="t" style="background:#35DCA2">★</span></div></body></html>`;
const { chromium } = await import("playwright-core");
const browser = await chromium.launch({ executablePath: findChrome() });
for (const [file, size, pad] of [["icon-192.png", 192, 0.12], ["icon-512.png", 512, 0.12], ["icon-maskable-512.png", 512, 0.22], ["apple-touch-icon.png", 180, 0.12]]) {
  const tab = await browser.newPage({ viewport: { width: size, height: size } });
  await tab.setContent(html(size, pad));
  await tab.screenshot({ path: path.join(OUT, file) });
  await tab.close();
}
await browser.close();
console.log(`Icons written to ${OUT}`);
