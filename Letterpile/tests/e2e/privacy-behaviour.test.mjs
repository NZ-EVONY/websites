// End-to-end checks that the Privacy Policy's claims match what the pages do.
import test from "node:test";
import assert from "node:assert/strict";
import { PUBLIC } from "../helpers.mjs";
import { createServer } from "../../scripts/serve.mjs";
import { findChrome } from "../../scripts/chrome.mjs";

const chrome = findChrome();
test("no third-party requests until 'Look up definition'; no cookies; show-all switch", { skip: chrome ? false : "NOT VERIFIED: no Chrome/Chromium found" }, async () => {
  const { chromium } = await import("playwright-core");
  const server = createServer(PUBLIC).listen(0);
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: chrome });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const external = [];
    await page.route("**/*", route => {
      const url = route.request().url();
      if (!url.startsWith(base)) {
        external.push(url);
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ meanings: [{ partOfSpeech: "noun", definitions: [{ definition: "test definition" }] }] }]) });
      }
      return route.continue();
    });
    await page.goto(`${base}/?letters=listen`);
    await page.waitForSelector("#results .word[data-word]");
    await page.click("#results .word[data-word]");
    await page.waitForSelector("#defineDialog[open]");
    await page.waitForTimeout(300);
    assert.deepEqual(external, [], "opening the word popup must not contact any third party");
    await page.click("#defineLookup");
    await page.waitForSelector("#defineResult ol li");
    assert.equal(external.length, 1);
    assert.match(external[0], /^https:\/\/api\.dictionaryapi\.dev\/api\/v2\/entries\/en\//);
    assert.equal(await page.innerText("#defineResult li"), "test definition");
    assert.deepEqual(await context.cookies(), [], "the site sets no cookies");

    // Show-all switch: off by default, remembered in localStorage, re-runs the search.
    await page.keyboard.press("Escape");
    assert.equal(await page.isChecked("[data-show-all]"), false);
    const before = await page.innerText("#results .summary");
    await page.check("[data-show-all]");
    assert.equal(await page.evaluate(() => localStorage.getItem("showAll")), "1");
    await page.waitForFunction(b => document.querySelector("#results .summary")?.innerText && document.querySelector("#results .summary").innerText !== "" , before);
    const keys = await page.evaluate(() => Object.keys(localStorage).sort());
    assert.deepEqual(keys.filter(k => !["showAll", "theme"].includes(k)), [], "only documented localStorage keys");
  } finally {
    await browser.close();
    server.close();
  }
});

test("theme is applied before first paint from localStorage", { skip: chrome ? false : "NOT VERIFIED: no Chrome/Chromium found" }, async () => {
  const { chromium } = await import("playwright-core");
  const server = createServer(PUBLIC).listen(0);
  const base = `http://localhost:${server.address().port}`;
  const browser = await chromium.launch({ executablePath: chrome });
  try {
    const page = await browser.newPage();
    // Record the theme at the moment <body> first exists, i.e. before anything is painted.
    await page.addInitScript(() => {
      try { localStorage.setItem("theme", "dark"); } catch {}
      const mo = new MutationObserver(() => {
        if (document.body) { window.__themeAtBody = document.documentElement.dataset.theme || "none"; mo.disconnect(); }
      });
      mo.observe(document, { childList: true, subtree: true });
    });
    await page.goto(`${base}/about`);
    const atDomContent = await page.evaluate(() => window.__themeAtBody);
    assert.equal(atDomContent, "dark");
  } finally {
    await browser.close();
    server.close();
  }
});
