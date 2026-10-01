#!/usr/bin/env node
"use strict";

// MyAddr backend: serves the static site and the tools a browser can't do alone
// (port check, ping, traceroute, WHOIS). Node >= 18, no dependencies.
//
//   node server.js                     -> http://127.0.0.1:8000
//   HOST=0.0.0.0 PORT=8080 node server.js
//   ALLOW_PRIVATE=1 node server.js     -> also allow LAN / loopback targets

const http = require("http");
const net = require("net");
const dns = require("dns").promises;
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const HOST = process.env.HOST || "127.0.0.1";
const PORT = +process.env.PORT || 8000;
const ALLOW_PRIVATE = process.env.ALLOW_PRIVATE === "1";
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const RATE_PER_MIN = +process.env.RATE_PER_MIN || 30;
const ROOT = __dirname;
const IS_WIN = process.platform === "win32";

// ---------- target validation ----------

const HOSTNAME = /^(?=.{1,253}$)([a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9])?\.)*[a-z0-9-]{1,63}$/i;

function ipv4ToInt(ip) {
  return ip.split(".").reduce((n, o) => (n << 8) + +o, 0) >>> 0;
}

const V4_BLOCKS = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4],
].map(([base, bits]) => [ipv4ToInt(base), bits]);

function isPrivate(ip) {
  if (net.isIPv4(ip)) {
    const n = ipv4ToInt(ip);
    return V4_BLOCKS.some(([base, bits]) => (n >>> (32 - bits)) === (base >>> (32 - bits)));
  }
  const s = ip.toLowerCase();
  const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivate(mapped[1]);
  return s === "::" || s === "::1" ||
    /^f[cd]/.test(s) ||           // fc00::/7 unique local
    /^fe[89ab]/.test(s) ||        // fe80::/10 link local
    /^ff/.test(s) ||              // multicast
    s.startsWith("2001:db8:");    // documentation
}

class UserError extends Error {}

// Resolve a hostname/IP to one address we're allowed to touch. Callers then
// connect to that address, so a DNS answer can't change between check and use.
async function resolveTarget(raw) {
  const host = String(raw || "").trim().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host) throw new UserError("Enter a hostname or IP address.");
  let addr;
  if (net.isIP(host)) addr = host;
  else if (HOSTNAME.test(host)) {
    try {
      addr = (await dns.lookup(host)).address;
    } catch {
      throw new UserError(`Couldn't resolve ${host}.`);
    }
  } else throw new UserError(`“${host}” isn't a valid hostname or IP address.`);
  if (!ALLOW_PRIVATE && isPrivate(addr)) {
    throw new UserError(`${addr} is a private or reserved address. Start the server with ALLOW_PRIVATE=1 to test your own network.`);
  }
  return { host, addr };
}

// ---------- tools ----------

function checkPort(addr, port, timeout = 3000) {
  return new Promise(resolve => {
    const start = Date.now();
    const sock = net.connect({ host: addr, port });
    const done = (status, detail) => {
      sock.destroy();
      resolve({ port, status, ms: Date.now() - start, detail });
    };
    sock.setTimeout(timeout);
    sock.once("connect", () => done("open"));
    sock.once("timeout", () => done("filtered", "No response (firewalled or host down)"));
    sock.once("error", e => e.code === "ECONNREFUSED"
      ? done("closed", "Connection refused")
      : done("filtered", e.code));
  });
}

function parsePorts(str) {
  const ports = new Set();
  for (const part of String(str || "").split(/[\s,]+/).filter(Boolean)) {
    const m = part.match(/^(\d{1,5})(?:-(\d{1,5}))?$/);
    if (!m) throw new UserError(`“${part}” isn't a port or range.`);
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b > 65535 || a > b) throw new UserError(`Ports must be between 1 and 65535.`);
    for (let p = a; p <= b; p++) {
      ports.add(p);
      if (ports.size > 25) throw new UserError("Check at most 25 ports at a time.");
    }
  }
  if (!ports.size) throw new UserError("Enter at least one port.");
  return [...ports];
}

const COMMAND = {
  ping: addr => IS_WIN
    ? ["ping", ["-n", "4", "-w", "2000", addr]]
    : ["ping", ["-c", "4", "-W", "2", addr]],
  traceroute: addr => IS_WIN
    ? ["tracert", ["-d", "-h", "20", "-w", "2000", addr]]
    : ["traceroute", ["-n", "-q", "1", "-w", "2", "-m", "20", ...(net.isIPv6(addr) ? ["-6"] : []), addr]],
};
if (process.platform === "darwin") {
  // macOS has separate binaries for IPv6 and a different ping timeout flag.
  COMMAND.ping = addr => net.isIPv6(addr) ? ["ping6", ["-c", "4", addr]] : ["ping", ["-c", "4", "-t", "10", addr]];
  const tr = COMMAND.traceroute;
  COMMAND.traceroute = addr => net.isIPv6(addr)
    ? ["traceroute6", ["-n", "-q", "1", "-w", "2", "-m", "20", addr]]
    : tr(addr).map((v, i) => i ? v.filter(a => a !== "-6") : v);
}

// Run ping/traceroute with argv (never a shell) and stream lines as SSE.
function streamCommand(res, tool, addr, req) {
  const [cmd, args] = COMMAND[tool](addr);
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-store",
    "x-accel-buffering": "no",
  });
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  send("start", { cmd: [cmd, ...args].join(" ") });

  const child = spawn(cmd, args, { windowsHide: true });
  const killer = setTimeout(() => child.kill(), 60_000);
  let buf = "";
  const onData = chunk => {
    buf += chunk;
    const lines = buf.split(/\r?\n/);
    buf = lines.pop();
    lines.forEach(l => send("line", l));
  };
  child.stdout.setEncoding("utf8").on("data", onData);
  child.stderr.setEncoding("utf8").on("data", onData);
  child.on("error", e => {
    send("fail", e.code === "ENOENT" ? `'${cmd}' isn't installed on the server.` : e.message);
    res.end();
  });
  child.on("close", code => {
    clearTimeout(killer);
    if (buf) send("line", buf);
    send("end", { code });
    res.end();
  });
  req.on("close", () => child.kill());
}

// Raw WHOIS over TCP/43.
function whoisQuery(server, query, timeout = 8000) {
  return new Promise((resolve, reject) => {
    let out = "";
    const sock = net.connect(43, server, () => sock.write(query + "\r\n"));
    sock.setEncoding("utf8");
    sock.setTimeout(timeout, () => sock.destroy(new Error(`${server} timed out`)));
    sock.on("data", d => { out += d; if (out.length > 200_000) sock.destroy(); });
    sock.on("close", () => resolve(out));
    sock.on("error", reject);
  });
}

const referral = text =>
  (text.match(/^\s*(?:refer|whois|Registrar WHOIS Server|ReferralServer):\s*(?:whois:\/\/|rwhois:\/\/)?([^\s:/]+)/im) || [])[1];

// Start at IANA, then follow referrals (registry -> registrar, or IANA -> RIR).
async function whois(raw) {
  let query = String(raw || "").trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/[/?#].*$/, "").replace(/\.$/, "");
  if (!net.isIP(query) && !HOSTNAME.test(query)) throw new UserError(`“${raw}” isn't a valid domain or IP address.`);
  if (!net.isIP(query) && query.startsWith("www.")) query = query.slice(4);

  const hops = [];
  let server = "whois.iana.org";
  for (let i = 0; i < 3 && server; i++) {
    // ARIN wants a flag to return the network record rather than a search.
    const q = server === "whois.arin.net" && net.isIP(query) ? `n + ${query}` : query;
    const text = await whoisQuery(server, q);
    hops.push({ server, text });
    const next = referral(text)?.toLowerCase();
    server = next && !hops.some(h => h.server === next) ? next : null;
  }
  return hops;
}

// ---------- http plumbing ----------

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_PER_MIN;
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, ts] of hits) if (ts.every(t => now - t >= 60_000)) hits.delete(ip);
}, 60_000).unref();

function clientIP(req) {
  const fwd = TRUST_PROXY && req.headers["x-forwarded-for"];
  return (fwd ? fwd.split(",")[0].trim() : req.socket.remoteAddress || "").replace(/^::ffff:/, "");
}

function sendJSON(res, status, obj) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(obj));
}

const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };
const PUBLIC = new Set(["index.html", "styles.css", "app.js"]);

function serveStatic(req, res, pathname) {
  const file = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!PUBLIC.has(file)) return sendJSON(res, 404, { error: "Not found" });
  fs.readFile(path.join(ROOT, file), (err, data) => {
    if (err) return sendJSON(res, 404, { error: "Not found" });
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}

async function handle(req, res) {
  const url = new URL(req.url, "http://x");
  const p = url.pathname;
  if (!p.startsWith("/api/")) return serveStatic(req, res, p);

  const ip = clientIP(req);
  if (p === "/api/health") return sendJSON(res, 200, { ok: true, allowPrivate: ALLOW_PRIVATE, platform: process.platform });
  if (p === "/api/myip") return sendJSON(res, 200, { ip });
  if (rateLimited(ip)) return sendJSON(res, 429, { error: `Slow down: ${RATE_PER_MIN} requests per minute.` });

  const q = url.searchParams;
  try {
    if (p === "/api/ports") {
      const ports = parsePorts(q.get("ports"));
      const { host, addr } = await resolveTarget(q.get("host"));
      const results = [];
      for (let i = 0; i < ports.length; i += 10) {
        results.push(...await Promise.all(ports.slice(i, i + 10).map(port => checkPort(addr, port))));
      }
      return sendJSON(res, 200, { host, addr, results });
    }
    if (p === "/api/ping" || p === "/api/traceroute") {
      const { addr } = await resolveTarget(q.get("host"));
      return streamCommand(res, p.slice(5), addr, req);
    }
    if (p === "/api/whois") {
      return sendJSON(res, 200, { hops: await whois(q.get("q")) });
    }
    return sendJSON(res, 404, { error: "Unknown endpoint" });
  } catch (e) {
    if (e instanceof UserError) return sendJSON(res, 400, { error: e.message });
    console.error(e);
    return sendJSON(res, 502, { error: e.message || "Upstream failure" });
  }
}

if (require.main === module) {
  http.createServer((req, res) => handle(req, res).catch(e => {
    console.error(e);
    if (!res.headersSent) sendJSON(res, 500, { error: "Server error" });
  })).listen(PORT, HOST, () => {
    console.log(`MyAddr running at http://${HOST.includes(":") ? `[${HOST}]` : HOST}:${PORT}`);
    if (ALLOW_PRIVATE) console.log("ALLOW_PRIVATE=1: private and loopback targets are allowed.");
  });
}

module.exports = { isPrivate, parsePorts, referral, resolveTarget };
