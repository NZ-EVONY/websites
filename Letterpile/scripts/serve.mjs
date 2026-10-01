// Tiny local static server for previews and tests. Usage: node scripts/serve.mjs <dir> [port]
// It imitates the parts of Cloudflare static assets this site relies on (plus simple _redirects):
//   - html_handling "drop-trailing-slash": /foo serves foo.html or foo/index.html;
//     /foo.html and /foo/ redirect (307) to /foo; / serves index.html.
//   - not_found_handling "404-page": unknown paths serve /404.html with status 404.
//   - a basic _headers parser (exact paths and trailing "*" splats; no placeholders).
// It does NOT replicate Cloudflare compression, caching, ETags or the managed robots.txt.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json",
};

export function parseHeaders(text) {
  const rules = [];
  let cur = null;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    if (!/^\s/.test(raw)) { cur = { pattern: raw.trim(), headers: [] }; rules.push(cur); continue; }
    const m = raw.trim().match(/^([^:]+):\s*(.*)$/);
    if (m && cur) cur.headers.push([m[1].trim(), m[2]]);
  }
  return rules;
}

function matches(pattern, p) {
  if (pattern.endsWith("*")) return p.startsWith(pattern.slice(0, -1));
  return pattern === p;
}

export function createServer(root) {
  root = path.resolve(root);
  const hdrFile = path.join(root, "_headers");
  const rules = fs.existsSync(hdrFile) ? parseHeaders(fs.readFileSync(hdrFile, "utf8")) : [];
  // _redirects: static "from to [status]" lines only (no splats or placeholders).
  const redirFile = path.join(root, "_redirects");
  const redirs = new Map(fs.existsSync(redirFile) ? fs.readFileSync(redirFile, "utf8").split(/\r?\n/)
    .filter(l => l.trim() && !l.trim().startsWith("#")).map(l => l.trim().split(/\s+/)).map(([f, t, s]) => [f, [t, +(s || 302)]]) : []);
  const exists = f => fs.existsSync(f) && fs.statSync(f).isFile();

  return http.createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    let p = decodeURIComponent(url.pathname);
    if (p.includes("..")) { res.writeHead(400); return res.end(); }
    const redirect = to => { res.writeHead(307, { Location: to + url.search }); res.end(); };

    if (redirs.has(p)) { const [to, status] = redirs.get(p); res.writeHead(status, { Location: to + url.search }); return res.end(); }
    if (p !== "/" && p.endsWith("/")) return redirect(p.replace(/\/+$/, ""));
    if (p.endsWith("/index.html")) return redirect(p.slice(0, -"index.html".length).replace(/(.)\/$/, "$1"));
    if (p.endsWith(".html")) return redirect(p.slice(0, -5));

    let file = null;
    const direct = path.join(root, p);
    if (p === "/") file = path.join(root, "index.html");
    else if (exists(direct)) file = direct;
    else if (exists(direct + ".html")) file = direct + ".html";
    else if (exists(path.join(direct, "index.html"))) file = path.join(direct, "index.html");

    let status = 200;
    if (!file || !exists(file)) {
      status = 404;
      file = path.join(root, "404.html");
      if (!exists(file)) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
    }
    const headers = { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "public, max-age=0, must-revalidate" };
    for (const r of rules) if (matches(r.pattern, p)) for (const [k, v] of r.headers) headers[k] = v;
    res.writeHead(status, headers);
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("serve.mjs")) {
  const [dir = "public", port = "8788"] = process.argv.slice(2);
  createServer(dir).listen(+port, () => console.log(`Serving ${dir} at http://localhost:${port}`));
}
