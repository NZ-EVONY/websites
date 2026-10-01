"use strict";

const $ = (sel, root = document) => root.querySelector(sel);

// ---------- helpers ----------

async function fetchJSON(url, { timeout = 8000, headers } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Try each source in order; return the first that succeeds.
// On total failure, report the primary source's error: it's usually the informative one.
async function firstOf(sources) {
  let firstErr;
  for (const src of sources) {
    try { return await src(); } catch (e) { firstErr ??= e; }
  }
  throw firstErr || new Error("No sources");
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function flagEmoji(cc) {
  if (!cc || cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1f1a5 + c.charCodeAt(0)));
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 1600);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast("Copied to clipboard");
}

// ---------- IP validation ----------

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

function isIPv6(s) {
  if (!/^[0-9a-f:.]+$/i.test(s) || !s.includes(":")) return false;
  const dbl = s.split("::");
  if (dbl.length > 2) return false;
  // Allow an embedded IPv4 tail (e.g. ::ffff:1.2.3.4).
  let groups = s.replace(/::/, ":x:").split(":").filter(g => g !== "");
  const tail = groups[groups.length - 1];
  let need = 8;
  if (tail && tail.includes(".")) {
    if (!IPV4.test(tail)) return false;
    groups = groups.slice(0, -1);
    need = 6;
  }
  const real = groups.filter(g => g !== "x");
  if (!real.every(g => /^[0-9a-f]{1,4}$/i.test(g))) return false;
  return dbl.length === 2 ? real.length < need : real.length === need;
}

const isIP = s => IPV4.test(s) || isIPv6(s);

// ---------- geolocation normalisation ----------

// Both providers are free, keyless and CORS-enabled; normalise to one shape.
function geoSources(ip = "") {
  return [
    async () => {
      const d = await fetchJSON(`https://ipwho.is/${encodeURIComponent(ip)}`);
      if (d.success === false) throw new Error(d.message || "Lookup failed");
      return {
        ip: d.ip,
        type: d.type,
        city: d.city, region: d.region, country: d.country, countryCode: d.country_code,
        postal: d.postal,
        lat: d.latitude, lon: d.longitude,
        timezone: d.timezone?.id, utc: d.timezone?.utc,
        isp: d.connection?.isp || d.connection?.org,
        org: d.connection?.org,
        asn: d.connection?.asn ? `AS${d.connection.asn}` : "",
      };
    },
    async () => {
      const d = await fetchJSON(`https://ipapi.co/${ip ? encodeURIComponent(ip) + "/" : ""}json/`);
      if (d.error) throw new Error(d.reason || "Lookup failed");
      return {
        ip: d.ip,
        type: d.version,
        city: d.city, region: d.region, country: d.country_name, countryCode: d.country_code,
        postal: d.postal,
        lat: d.latitude, lon: d.longitude,
        timezone: d.timezone, utc: d.utc_offset,
        isp: d.org, org: d.org,
        asn: d.asn || "",
      };
    },
  ];
}

function placeLine(g) {
  const parts = [g.city, g.region, g.country].filter(Boolean);
  const unique = parts.filter((p, i) => parts.indexOf(p) === i);
  return unique.length ? `${flagEmoji(g.countryCode)} ${unique.join(", ")}`.trim() : "Unknown";
}

function geoFields(g) {
  const coords = g.lat != null && g.lon != null ? `${(+g.lat).toFixed(4)}, ${(+g.lon).toFixed(4)}` : "";
  return {
    location: placeLine(g),
    isp: g.isp || "Unknown",
    asn: g.asn || "Unknown",
    timezone: [g.timezone, g.utc && `(UTC${g.utc.startsWith("+") || g.utc.startsWith("-") ? "" : "+"}${g.utc})`].filter(Boolean).join(" ") || "Unknown",
    coords: coords || "Unknown",
    postal: g.postal || "—",
  };
}

// ---------- hero: my IP ----------

function setIP(id, value) {
  const el = $("#" + id);
  const btn = $(`[data-copy="${id}"]`);
  if (value) {
    el.textContent = value;
    el.dataset.state = "ok";
    btn.disabled = false;
  } else {
    el.textContent = "Not available";
    el.dataset.state = "none";
    btn.disabled = true;
  }
}

async function detectMyIP() {
  const [v4, v6] = await Promise.allSettled([
    firstOf([
      async () => (await fetchJSON("https://api.ipify.org?format=json")).ip,
      async () => (await (await fetch("https://ipv4.icanhazip.com", { cache: "no-store" })).text()).trim(),
    ]),
    // api64 answers over IPv6 when the client has it, otherwise IPv4.
    fetchJSON("https://api64.ipify.org?format=json").then(d => d.ip),
  ]);
  const ipv4 = v4.status === "fulfilled" && IPV4.test(v4.value) ? v4.value : null;
  const ipv6 = v6.status === "fulfilled" && isIPv6(v6.value) ? v6.value : null;
  setIP("ipv4", ipv4);
  setIP("ipv6", ipv6);

  const dl = $("#myDetails");
  try {
    const g = await firstOf(geoSources(ipv4 || ipv6 || ""));
    // If both IP services failed, the geo provider still saw our address.
    if (!ipv4 && !ipv6 && g.ip) setIP(isIPv6(g.ip) ? "ipv6" : "ipv4", g.ip);
    const f = geoFields(g);
    for (const [k, v] of Object.entries(f)) {
      const dd = dl.querySelector(`[data-k="${k}"]`);
      if (dd) dd.textContent = v;
    }
  } catch {
    dl.querySelectorAll("dd").forEach(dd => { dd.textContent = "Unavailable"; });
  }
}

// ---------- IP lookup tool ----------

function renderGeo(g) {
  const f = geoFields(g);
  const mapLink = g.lat != null
    ? `<a href="https://www.openstreetmap.org/?mlat=${g.lat}&mlon=${g.lon}#map=10/${g.lat}/${g.lon}" target="_blank" rel="noopener">View on map ↗</a>`
    : "";
  const rows = [
    ["IP address", `<code>${esc(g.ip)}</code>`],
    ["Version", esc(g.type || (isIPv6(g.ip) ? "IPv6" : "IPv4"))],
    ["Location", esc(f.location)],
    ["ISP", esc(f.isp)],
    ["Organisation", esc(g.org || "—")],
    ["ASN", esc(f.asn)],
    ["Time zone", esc(f.timezone)],
    ["Coordinates", `${esc(f.coords)} ${mapLink}`],
  ];
  return `<dl class="kv">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
}

function initLookup() {
  const form = $("#lookupForm");
  const input = $("#lookupInput");
  const out = $("#lookupResult");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const ip = input.value.trim().replace(/^\[|\]$/g, "");
    out.hidden = false;
    if (!isIP(ip)) {
      out.innerHTML = `<p class="err">“${esc(ip)}” isn't a valid IPv4 or IPv6 address.</p>`;
      return;
    }
    out.innerHTML = `<p class="loading">Looking up ${esc(ip)}…</p>`;
    try {
      out.innerHTML = renderGeo(await firstOf(geoSources(ip)));
    } catch (err) {
      out.innerHTML = `<p class="err">Lookup failed: ${esc(err.message || "network error")}. Private and reserved ranges (10.x, 192.168.x, etc.) have no public location.</p>`;
    }
  });
}

// ---------- DNS lookup tool ----------

const DNS_STATUS = { 0: "NOERROR", 1: "FORMERR", 2: "SERVFAIL", 3: "NXDOMAIN", 4: "NOTIMP", 5: "REFUSED" };
const DNS_TYPES = { 1: "A", 2: "NS", 5: "CNAME", 6: "SOA", 15: "MX", 16: "TXT", 28: "AAAA", 257: "CAA" };

function initDNS() {
  const form = $("#dnsForm");
  const out = $("#dnsResult");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = $("#dnsInput").value.trim()
      .replace(/^[a-z]+:\/\//i, "").replace(/[/?#].*$/, "").replace(/\.$/, "");
    const type = $("#dnsType").value;
    out.hidden = false;
    if (!/^(?=.{1,253}$)([a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9])?\.)*[a-z0-9-]{1,63}$/i.test(name)) {
      out.innerHTML = `<p class="err">“${esc(name)}” isn't a valid domain name.</p>`;
      return;
    }
    out.innerHTML = `<p class="loading">Querying ${esc(type)} records for ${esc(name)}…</p>`;
    const q = `name=${encodeURIComponent(name)}&type=${type}`;
    try {
      const d = await firstOf([
        () => fetchJSON(`https://cloudflare-dns.com/dns-query?${q}`, { headers: { accept: "application/dns-json" } }),
        () => fetchJSON(`https://dns.google/resolve?${q}`),
      ]);
      const answers = d.Answer || [];
      if (d.Status !== 0) {
        out.innerHTML = `<p class="err">${esc(DNS_STATUS[d.Status] || "Error " + d.Status)} — ${d.Status === 3 ? "that domain doesn't exist." : "the resolver couldn't answer."}</p>`;
      } else if (!answers.length) {
        out.innerHTML = `<p class="loading">No ${esc(type)} records found for ${esc(name)}.</p>`;
      } else {
        out.innerHTML = `<div class="table-scroll"><table class="records">
          <thead><tr><th>Name</th><th>Type</th><th>TTL</th><th>Value</th></tr></thead>
          <tbody>${answers.map(a => `<tr>
            <td>${esc(a.name)}</td><td>${esc(DNS_TYPES[a.type] || a.type)}</td><td>${esc(a.TTL)}s</td><td class="data">${esc(a.data)}</td>
          </tr>`).join("")}</tbody></table></div>`;
      }
    } catch (err) {
      out.innerHTML = `<p class="err">DNS query failed: ${esc(err.message || "network error")}.</p>`;
    }
  });
}

// ---------- password generator ----------

const SETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/~",
};
const LOOKALIKES = /[Il1O0o|]/g;

// Unbiased integer in [0, n) via rejection sampling.
function randInt(n) {
  const max = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= max);
  return buf[0] % n;
}

function generatePassword(len, opts) {
  const sets = Object.keys(SETS).filter(k => opts[k])
    .map(k => opts.ambig ? SETS[k].replace(LOOKALIKES, "") : SETS[k]);
  if (!sets.length) return "";
  const all = sets.join("");
  // Guarantee one character from each chosen set, then fill and shuffle.
  const chars = sets.map(s => s[randInt(s.length)]);
  while (chars.length < len) chars.push(all[randInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return { pw: chars.join(""), bits: Math.round(len * Math.log2(all.length)) };
}

function initPassword() {
  const ids = ["pwUpper", "pwLower", "pwDigits", "pwSymbols", "pwAmbig", "pwLen"];
  const regen = () => {
    const len = +$("#pwLen").value;
    $("#pwLenVal").textContent = len;
    const r = generatePassword(len, {
      upper: $("#pwUpper").checked, lower: $("#pwLower").checked,
      digits: $("#pwDigits").checked, symbols: $("#pwSymbols").checked,
      ambig: $("#pwAmbig").checked,
    });
    const meter = $("#pwMeter");
    if (!r) {
      $("#pwOut").textContent = "Pick at least one character set";
      $("#pwStrength").textContent = "";
      meter.style.width = "0";
      return;
    }
    $("#pwOut").textContent = r.pw;
    const [label, color] = r.bits < 50 ? ["Weak", "var(--bad)"] : r.bits < 80 ? ["Fair", "var(--warn)"] : ["Strong", "var(--ok)"];
    meter.style.width = Math.min(100, r.bits / 1.28) + "%";
    meter.style.background = color;
    $("#pwStrength").textContent = `${label} · ~${r.bits} bits of entropy`;
  };
  ids.forEach(id => $("#" + id).addEventListener("input", regen));
  $("#pwRegen").addEventListener("click", regen);
  regen();
}

// ---------- browser info ----------

function parseUA(ua) {
  const b = [[/Edg\/([\d.]+)/, "Edge"], [/OPR\/([\d.]+)/, "Opera"], [/Firefox\/([\d.]+)/, "Firefox"],
    [/Chrome\/([\d.]+)/, "Chrome"], [/Version\/([\d.]+).*Safari/, "Safari"]]
    .map(([re, n]) => { const m = ua.match(re); return m && `${n} ${m[1].split(".")[0]}`; }).find(Boolean) || "Unknown";
  const os = [[/Windows NT 10/, "Windows 10/11"], [/Windows NT/, "Windows"], [/iPhone|iPad/, "iOS"],
    [/Android ([\d.]+)/, "Android"], [/Mac OS X/, "macOS"], [/CrOS/, "ChromeOS"], [/Linux/, "Linux"]]
    .map(([re, n]) => { const m = ua.match(re); return m && (m[1] ? `${n} ${m[1]}` : n); }).find(Boolean) || "Unknown";
  return { browser: b, os };
}

function initBrowser() {
  const nav = navigator;
  const { browser, os } = parseUA(nav.userAgent);
  const conn = nav.connection;
  const rows = [
    ["Browser", browser],
    ["Operating system", os],
    ["Language", (nav.languages || [nav.language]).join(", ")],
    ["Local time zone", Intl.DateTimeFormat().resolvedOptions().timeZone],
    ["Screen", `${screen.width} × ${screen.height} @ ${window.devicePixelRatio}x`],
    ["Window", `${innerWidth} × ${innerHeight}`],
    ["CPU threads", nav.hardwareConcurrency || "Unknown"],
    ["Cookies", nav.cookieEnabled ? "Enabled" : "Disabled"],
    ["Do Not Track", nav.doNotTrack === "1" ? "On" : "Off"],
    ["Connection", conn?.effectiveType ? `${conn.effectiveType}${conn.downlink ? `, ~${conn.downlink} Mbps` : ""}` : "Not exposed"],
    ["Touch", nav.maxTouchPoints > 0 ? `Yes (${nav.maxTouchPoints} points)` : "No"],
  ];
  $("#browserInfo").innerHTML =
    rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("") +
    `<div style="grid-column:1/-1"><dt>User agent</dt><dd><code>${esc(nav.userAgent)}</code></dd></div>`;
}

// ---------- server-backed tools ----------

async function apiJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

async function detectServer() {
  const ok = location.protocol.startsWith("http") &&
    await apiJSON("/api/health").then(d => d.ok, () => false);
  document.body.classList.toggle("no-server", !ok);
  $("#serverNote").hidden = ok;
}

// Pull the fields people usually want out of raw WHOIS text.
const WHOIS_FIELDS = [
  ["Domain", /^\s*Domain Name:\s*(.+)$/im],
  ["Registrar", /^\s*Registrar:\s*(.+)$/im],
  ["Created", /^\s*(?:Creation Date|created|RegDate):\s*(.+)$/im],
  ["Updated", /^\s*(?:Updated Date|last-modified|changed|Updated):\s*(.+)$/im],
  ["Expires", /^\s*(?:Registry Expiry Date|Registrar Registration Expiration Date|Expiry Date|expires):\s*(.+)$/im],
  ["Status", /^\s*Domain Status:\s*(\S+)/im],
  ["Organisation", /^\s*(?:OrgName|org-name|Registrant Organization|descr):\s*(.+)$/im],
  ["Network", /^\s*(?:NetRange|inetnum|inet6num):\s*(.+)$/im],
  ["CIDR", /^\s*(?:CIDR|route6?):\s*(.+)$/im],
  ["Country", /^\s*(?:Country|Registrant Country):\s*(.+)$/im],
];

function whoisSummary(hops) {
  // The last hop is the most specific (registrar / RIR), so search it first.
  const texts = hops.map(h => h.text).reverse();
  const rows = WHOIS_FIELDS.map(([label, re]) => {
    for (const t of texts) { const m = t.match(re); if (m) return [label, m[1].trim()]; }
    return null;
  }).filter(Boolean);
  const ns = [...new Set(texts.flatMap(t => [...t.matchAll(/^\s*(?:Name Server|nserver):\s*(\S+)/gim)].map(m => m[1].toLowerCase())))];
  if (ns.length) rows.push(["Name servers", ns.join(", ")]);
  return rows;
}

function initWhois() {
  const out = $("#whoisResult");
  $("#whoisForm").addEventListener("submit", async e => {
    e.preventDefault();
    const q = $("#whoisInput").value.trim();
    out.hidden = false;
    out.innerHTML = `<p class="loading">Querying WHOIS for ${esc(q)}…</p>`;
    try {
      const { hops } = await apiJSON(`/api/whois?q=${encodeURIComponent(q)}`);
      const rows = whoisSummary(hops);
      out.innerHTML =
        (rows.length ? `<dl class="kv whois-summary">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : "") +
        hops.map(h => `<div class="whois-hop"><h3>${esc(h.server)}</h3><pre>${esc(h.text.trim() || "(empty response)")}</pre></div>`).join("");
    } catch (err) {
      out.innerHTML = `<p class="err">${esc(err.message)}</p>`;
    }
  });
}

function initPorts() {
  const out = $("#portResult");
  $("#portPresets").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.id === "usePortMyIP") {
      const mine = $("#ipv4").dataset.state === "ok" ? $("#ipv4").textContent : $("#ipv6").textContent;
      if ($("#ipv4").dataset.state === "ok" || $("#ipv6").dataset.state === "ok") $("#portHost").value = mine;
    } else $("#portList").value = b.dataset.ports;
  });
  $("#portForm").addEventListener("submit", async e => {
    e.preventDefault();
    const host = $("#portHost").value.trim();
    const ports = $("#portList").value.trim();
    const btn = e.submitter || $("#portForm button");
    out.hidden = false;
    out.innerHTML = `<p class="loading">Checking ${esc(ports)} on ${esc(host)}…</p>`;
    btn.disabled = true;
    try {
      const d = await apiJSON(`/api/ports?host=${encodeURIComponent(host)}&ports=${encodeURIComponent(ports)}`);
      const via = d.host !== d.addr ? ` (${esc(d.addr)})` : "";
      out.innerHTML = `<p class="loading">${esc(d.host)}${via}</p><div class="table-scroll"><table class="records">
        <thead><tr><th>Port</th><th>Status</th><th>Time</th><th>Detail</th></tr></thead>
        <tbody>${d.results.map(r => `<tr>
          <td><code>${r.port}</code></td><td><span class="status ${r.status}">${r.status}</span></td>
          <td>${r.ms} ms</td><td>${esc(r.detail || (r.status === "open" ? "Accepting connections" : ""))}</td>
        </tr>`).join("")}</tbody></table></div>`;
    } catch (err) {
      out.innerHTML = `<p class="err">${esc(err.message)}</p>`;
    } finally {
      btn.disabled = false;
    }
  });
}

function initPing() {
  const out = $("#pingOut");
  const go = $("#pingGo");
  let ctrl;
  const line = (text, cls) => {
    const span = document.createElement("span");
    if (cls) span.className = cls;
    span.textContent = text + "\n";
    out.appendChild(span);
    out.scrollTop = out.scrollHeight;
  };
  const handlers = {
    start: d => line("$ " + d.cmd, "dim"),
    line: d => line(d),
    fail: d => line(d, "err"),
    end: d => line(`[exited with code ${d.code}]`, "dim"),
  };

  $("#pingForm").addEventListener("submit", async e => {
    e.preventDefault();
    if (ctrl) return ctrl.abort();
    const host = $("#pingHost").value.trim();
    const tool = $("#pingTool").value;
    out.hidden = false;
    out.textContent = "";
    ctrl = new AbortController();
    go.textContent = "Stop";
    try {
      const res = await fetch(`/api/${tool}?host=${encodeURIComponent(host)}`, { cache: "no-store", signal: ctrl.signal });
      if (!res.headers.get("content-type")?.includes("event-stream")) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      // Parse the server-sent event stream by hand from one fetch.
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const events = buf.split("\n\n");
        buf = events.pop();
        for (const ev of events) {
          const type = ev.match(/^event: (.+)$/m)?.[1];
          const data = ev.match(/^data: (.*)$/m)?.[1];
          if (type in handlers && data != null) handlers[type](JSON.parse(data));
        }
      }
    } catch (err) {
      line(err.name === "AbortError" ? "[stopped]" : err.message, err.name === "AbortError" ? "dim" : "err");
    } finally {
      ctrl = null;
      go.textContent = "Run";
    }
  });
}

// ---------- theme + copy wiring ----------

function initTheme() {
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch {}
  $("#themeToggle").addEventListener("click", () => {
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch {}
  });
}

document.addEventListener("click", e => {
  const btn = e.target.closest("[data-copy]");
  if (btn && !btn.disabled) copyText($("#" + btn.dataset.copy).textContent);
});

initTheme();
initLookup();
initDNS();
initPassword();
initBrowser();
initWhois();
initPorts();
initPing();
detectServer();
detectMyIP();
