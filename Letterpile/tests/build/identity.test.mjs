// Identity, contact and CSP checks on the built HTML (the "Tile Table, Night Edition" refresh).
// Runs against public/ after `npm run build`.
import test from "node:test";
import assert from "node:assert/strict";
import { htmlFiles, readPublic, site } from "../helpers.mjs";

const pages = htmlFiles().map(f => ({ file: f, html: readPublic(f) }));
// Built from parts so this file doesn't itself match a repo-wide search for them.
const NAME = ["Croc", "ker"].join("");
const OTHER_SITE = new RegExp(["my", "addr"].join(""), "i");

test("no personal name, no other site's address and no AI-assistance wording in any page", () => {
  // The name check is case-sensitive: the word list contains an ordinary word that starts with
  // the same letters in lower case.
  for (const p of pages) {
    assert.ok(!p.html.includes(NAME), `${p.file} contains a personal name`);
    assert.ok(!OTHER_SITE.test(p.html), `${p.file} mentions another site's domain`);
    assert.ok(!/AI-assist/i.test(p.html), `${p.file} mentions AI assistance`);
  }
});

test("no inline style attributes (CSP style-src 'self')", () => {
  for (const p of pages) assert.ok(!/\sstyle\s*=/i.test(p.html), `${p.file} has a style attribute`);
});

test("contact page and footer give nz@letterpile.app", () => {
  assert.equal(site.contactEmail, "nz@letterpile.app");
  assert.match(readPublic("contact.html"), /href="mailto:nz@letterpile\.app">nz@letterpile\.app<\/a>/);
  for (const p of pages) assert.match(p.html, /<a class="mail" href="mailto:nz@letterpile\.app">/, `${p.file} footer email`);
});

test("publisher reads as Letterpile, an independent publisher in New Zealand; JSON-LD has no Person", () => {
  assert.match(readPublic("contact.html"), /run by an independent publisher in New Zealand/);
  assert.match(readPublic("about.html"), /run by an independent publisher in New Zealand/);
  for (const p of pages) {
    assert.ok(!/"@type":"Person"/.test(p.html), `${p.file} JSON-LD has a Person`);
    for (const m of p.html.matchAll(/"author":(\{[^}]*\})/g)) assert.deepEqual(JSON.parse(m[1]), { "@type": "Organization", name: "Letterpile" }, p.file);
  }
});

test("home A-Z tile counts match the /words-starting-with hub", () => {
  const count = s => Number(s.replace(/,/g, ""));
  const home = Object.fromEntries([...readPublic("index.html").matchAll(/<a href="\/words-starting-with\/([a-z])">[A-Z]<small> ([\d,]+)</g)].map(m => [m[1], count(m[2])]));
  const hub = Object.fromEntries([...readPublic("words-starting-with.html").matchAll(/<a href="\/words-starting-with\/([a-z])">[A-Z]<\/a> <span class="count">([\d,]+)</g)].map(m => [m[1], count(m[2])]));
  assert.equal(Object.keys(home).length, 26);
  assert.deepEqual(home, hub);
});
