// Template partial tests (ad slot, consent and AdSense integration points).
import test from "node:test";
import assert from "node:assert/strict";
import adSlot from "../../src/templates/partials/ad-slot.mjs";
import cmpSlot from "../../src/templates/partials/cmp-slot.mjs";
import adsenseSlot from "../../src/templates/partials/adsense-slot.mjs";

test("ad slot: label, marked comment, no ad code", () => {
  const html = adSlot("after-intro");
  assert.match(html, /<!-- AD SLOT: after-intro\. Paste AdSense <ins> unit here\. Do not auto-refresh\. -->/);
  assert.match(html, /<aside class="ad-slot" data-ad-slot="after-intro" aria-label="Advertisement"><span class="ad-label">Advertisement<\/span><div class="ad-slot__inner" data-ad-placeholder><\/div><\/aside>/);
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ""), /<ins|adsbygoogle|<script/);
  assert.match(adSlot("x", { dev: true }), /ad-slot--dev/);
});

test("CMP and AdSense slots are comments only", () => {
  for (const html of [cmpSlot(), adsenseSlot()]) {
    assert.equal(html.replace(/<!--[\s\S]*?-->/g, "").trim(), "");
    assert.doesNotMatch(html, /adsbygoogle|pub-\d/);
  }
  assert.match(cmpSlot(), /TCF v2\.3/);
});
