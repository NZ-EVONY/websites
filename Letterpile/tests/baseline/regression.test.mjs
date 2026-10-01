// Live-site regression: the ten live URLs keep working with the same purpose, the
// IDs and query parameters their scripts use still exist, and old deep links work.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { PUBLIC, readJson, readPublic, publicFiles } from "../helpers.mjs";
import { createServer } from "../../scripts/serve.mjs";
import { findChrome } from "../../scripts/chrome.mjs";

const baseline = readJson("tests/baseline/live-urls.json");
// Old element IDs that the build now renders differently (header/menu are static
// HTML, the More menu is a <details>, definition popup is restructured).
const MOVED_IDS = { defineBody: "defineResult" };

test("the ten live URLs exist in public/ as clean-URL pages with title, h1 and description", () => {
  assert.equal(baseline.pages.length, 10);
  for (const p of baseline.pages) {
    const file = p.path === "/" ? "index.html" : p.path.slice(1) + ".html";
    assert.ok(fs.existsSync(path.join(PUBLIC, file)), `${p.path} -> ${file}`);
    const html = readPublic(file);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(html, /<h1[^>]*>[^<]+<\/h1>/);
    assert.match(html, /<meta name="description" content="[^"]+">/);
    assert.match(html, new RegExp(`<body data-page="${p.bodyPage}"`), `${p.path} keeps its page key`);
    for (const id of p.ids) {
      const want = MOVED_IDS[id] || id;
      assert.ok(html.includes(`id="${want}"`), `${p.path} lost element #${id}`);
    }
  }
});

test("no live URL became a redirect, and nothing that shouldn't be public is", () => {
  assert.ok(!fs.existsSync(path.join(PUBLIC, "_redirects")), "no _redirects file expected");
  for (const f of publicFiles()) assert.doesNotMatch(f, /(^|\/)(\.git|\.backup|\.wrangler|node_modules|docs|tests|scripts)(\/|$)|\.md$|enable1\.txt$|wrangler\.jsonc$|\.dev\.vars$/);
});

const chrome = findChrome();
test("old deep links still prefill and run (Chromium)", { skip: chrome ? false : "NOT VERIFIED: no Chrome/Chromium found" }, async () => {
  const { chromium } = await import("playwright-core");
  const server = createServer(PUBLIC).listen(0);
  const port = server.address().port;
  const browser = await chromium.launch({ executablePath: chrome });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
    const cases = [
      ["/?letters=tacre", "#letters", "tacre", /words from TACRE/],
      ["/?letters=retinas&starts=s&len=7", "#starts", "s", /words from RETINAS/],
      ["/scrabble-word-finder?rack=retains&board=e", "#rack", "retains", /words/],
      ["/words-with-friends?rack=qat%3F", "#rack", "qat?", /words/],
      ["/anagram-solver?q=listen", "#q", "listen", /SILENT/],
      ["/jumble-solver?w=elbat,odrw&final=tsaeb", "#final", "tsaeb", /TABLE/],
      ["/crossword-solver?p=c%3Fo%3Fs&exc=h", "#exclude", "h", /words? fits? C\?O\?S/],
      ["/text-twist-solver?letters=drange&min=5", "#letters", "drange", /GARDEN/],
      ["/word-combiner?w=breakfast,lunch", ".w", "breakfast", /BRUNCH/],
    ];
    for (const [url, sel, value, expect] of cases) {
      await page.goto(`http://localhost:${port}${url}`);
      assert.equal(await page.inputValue(sel), value, `${url} prefill`);
      await page.waitForFunction(re => new RegExp(re).test(document.querySelector("#results").innerText), expect.source, { timeout: 15000 });
      const robots = await page.getAttribute('meta[name="robots"]', "content");
      assert.equal(robots, "noindex, follow", `${url} is noindex`);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    server.close();
  }
});
