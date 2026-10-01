// Records the live-site regression baseline from the git tag `live-before-upgrade`.
// Usage: node scripts/baseline-capture.mjs  ->  tests/baseline/live-urls.json
// Run once (Step 0). The file is committed; regression tests compare the build against it.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";

const TAG = "live-before-upgrade";
const show = f => execFileSync("git", ["show", `${TAG}:Letterpile/${f}`], { encoding: "utf8", maxBuffer: 1 << 26 });
const PAGES = {
  "/": "index.html", "/word-scrambler": "word-scrambler.html", "/word-combiner": "word-combiner.html",
  "/scrabble-word-finder": "scrabble-word-finder.html", "/words-with-friends": "words-with-friends.html",
  "/wordle-solver": "wordle-solver.html", "/anagram-solver": "anagram-solver.html", "/jumble-solver": "jumble-solver.html",
  "/crossword-solver": "crossword-solver.html", "/text-twist-solver": "text-twist-solver.html",
};

export function visibleText(html) {
  return html
    .replace(/<head[\s\S]*?<\/head>/i, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const pages = Object.entries(PAGES).map(([p, file]) => {
  const html = show(file);
  const text = visibleText(html);
  const markup = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]).filter(id => !["main", "sidebar"].includes(id));
  // Query parameters each page's script reads (getParams() keys and p.xxx accesses).
  const params = [...new Set([...html.matchAll(/\bp\.([a-z]+)\b/g)].map(m => m[1]))];
  return {
    path: p,
    file,
    expectedStatus: 200,
    title: html.match(/<title>(.*?)<\/title>/)[1],
    h1: html.match(/<h1[^>]*>(.*?)<\/h1>/)[1],
    description: html.match(/<meta name="description" content="([^"]*)"/)[1],
    bodyPage: html.match(/<body data-page="([^"]+)"/)[1],
    visibleWords: text.split(" ").length,
    visibleTextSha256: createHash("sha256").update(text).digest("hex"),
    ids,
    queryParams: params,
  };
});

const out = {
  capturedFrom: `git tag ${TAG} (commit ${execFileSync("git", ["rev-list", "-n", "1", TAG], { encoding: "utf8" }).trim()})`,
  note: "Live HTTP checks against https://letterpile.app could not be run from the build environment (network policy denied the host). The 'liveBehaviour' block is the planner's curl table from 2026-10-02, recorded as NOT VERIFIED here.",
  liveBehaviour: {
    "/": "200", "/word-scrambler": "200", "/word-scrambler.html": "307 -> /word-scrambler", "/index.html": "307 -> /",
    "/robots.txt": "200 (Cloudflare managed content-signals block only)", "/sitemap.xml": "404", "/ads.txt": "404",
    "/privacy-policy": "404", "/about": "404", "https://www.letterpile.app/": "200 duplicate", "http://letterpile.app/": "200 over HTTP",
  },
  pages,
};
fs.mkdirSync("tests/baseline", { recursive: true });
fs.writeFileSync("tests/baseline/live-urls.json", JSON.stringify(out, null, 2) + "\n");
console.log(pages.map(p => `${p.path.padEnd(22)} words=${p.visibleWords} ids=${p.ids.length} params=${p.queryParams.join(",")}`).join("\n"));
