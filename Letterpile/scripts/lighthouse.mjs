// Lighthouse (mobile emulation, lab data) against a local static server.
// Usage: node scripts/lighthouse.mjs [dir=public] [label=current] [path ...]
// Reports go to reports/lighthouse/<label>/ (gitignored). Needs Chrome/Chromium:
// set CHROME_PATH, or it tries the Playwright Chromium and common install paths.
// The local server does not compress responses (Cloudflare does), so transfer sizes
// and LCP here are pessimistic compared with production.
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "./serve.mjs";
import { findChrome } from "./chrome.mjs";

const [dir = "public", label = "current", ...paths] = process.argv.slice(2);
const urls = paths.length ? paths : ["/", "/wordle-solver", "/privacy-policy"];
const chrome = findChrome();
if (!chrome) { console.error("NOT VERIFIED: no Chrome/Chromium found. Set CHROME_PATH."); process.exit(2); }

const port = 8790 + Math.floor(Math.random() * 100);
const server = createServer(dir).listen(port);
const outDir = path.join("reports", "lighthouse", label);
fs.mkdirSync(outDir, { recursive: true });
const bin = path.join("node_modules", ".bin", process.platform === "win32" ? "lighthouse.cmd" : "lighthouse");

// Async, so the in-process server keeps answering while Lighthouse runs.
const run = (cmd, args, opts) => new Promise((resolve, reject) => {
  spawn(cmd, args, opts).on("exit", code => code === 0 ? resolve() : reject(new Error(`lighthouse exited ${code}`)));
});

const rows = [];
try {
  for (const u of urls) {
    const name = (u.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home");
    await run(bin, [`http://localhost:${port}${u}`, "--quiet", "--output=json", "--output=html", `--output-path=${path.join(outDir, name)}`,
      `--chrome-path=${chrome}`, "--chrome-flags=--headless=new --no-sandbox", "--form-factor=mobile", "--throttling-method=simulate"],
      { stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, CHROME_PATH: chrome } });
    const r = JSON.parse(fs.readFileSync(path.join(outDir, `${name}.report.json`), "utf8"));
    const c = r.categories, a = r.audits;
    rows.push({
      url: u,
      perf: Math.round(c.performance.score * 100), a11y: Math.round(c.accessibility.score * 100),
      bp: Math.round(c["best-practices"].score * 100), seo: Math.round(c.seo.score * 100),
      lcp: a["largest-contentful-paint"].displayValue, cls: a["cumulative-layout-shift"].displayValue, tbt: a["total-blocking-time"].displayValue,
    });
  }
} finally { server.close(); }

console.table(rows);
fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify({ when: new Date().toISOString(), lighthouse: execFileSync(bin, ["--version"], { encoding: "utf8", shell: process.platform === "win32" }).trim(), chrome, rows }, null, 2));
