// WHOIS over TCP port 43, starting at IANA and following referrals (max 3 servers).
// Output is a whitelist of fields: personal data (names, e-mails, phones, addresses, handles,
// remarks) is never returned.
import { parseIP, normalizeIP, isGloballyRoutable } from "./ip.js";

export class UserError extends Error {}

const LOCAL_SUFFIXES = [".local", ".internal", ".localhost", ".lan", ".home", ".corp", ".arpa"];
const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const TLD = /^([a-z]{2,24}|xn--[a-z0-9-]{1,59})$/;

/** Hostname check used for queried domains and for referral servers from responses. */
export function isValidHostname(h) {
  if (typeof h !== "string" || h.length < 3 || h.length > 253 || parseIP(h)) return false;
  const labels = h.split(".");
  if (labels.length < 2) return false;
  if (!labels.every(l => LABEL.test(l))) return false;
  return TLD.test(labels.at(-1));
}

/** Validate and normalise a WHOIS query. Returns { kind: "domain"|"ip", query } or throws UserError. */
export function normalizeQuery(raw) {
  if (typeof raw !== "string") throw new UserError("Enter a domain name or IP address.");
  let q = raw.trim();
  if (!q) throw new UserError("Enter a domain name or IP address.");
  if (q.length > 300) throw new UserError("That's too long to be a domain name or IP address.");
  // Anything that could be written to the socket as an extra command is refused outright.
  if (/[\s\x00-\x1f\x7f@\\]/.test(q)) throw new UserError("Remove spaces and special characters such as @ or \\.");
  q = q.replace(/^https?:\/\//i, "");
  if (/^\[/.test(q)) {
    const m = q.match(/^\[([0-9a-fA-F:.]+)\]$/);
    if (!m) throw new UserError("That isn't a valid IP address.");
    q = m[1];
  }
  const ip = parseIP(q);
  if (ip) {
    if (!isGloballyRoutable(ip)) throw new UserError("That's a private, reserved or documentation address. It isn't registered to anyone, so there's no WHOIS record.");
    return { kind: "ip", query: normalizeIP(ip) };
  }
  if (/^[0-9.]+(:\d+)?$/.test(q) || /^[0-9a-f:]+:[0-9a-f:]*$/i.test(q) && q.includes("::")) throw new UserError("That isn't a valid IP address.");
  q = q.replace(/[/?#].*$/, "").replace(/:\d+$/, "").replace(/\.$/, "").toLowerCase();
  let host;
  try { host = new URL(`http://${q}`).hostname; } catch { throw new UserError("That isn't a valid domain name."); }
  if (host !== q && !/^[a-z0-9.-]+$/.test(host)) throw new UserError("That isn't a valid domain name.");
  if (parseIP(host)) throw new UserError("That isn't a valid domain name.");
  if (host.startsWith("www.")) host = host.slice(4);
  if (!isValidHostname(host)) throw new UserError("That isn't a valid domain name. Use a name like example.com.");
  if (LOCAL_SUFFIXES.some(s => host.endsWith(s))) throw new UserError("Local and internal names aren't registered, so there's no WHOIS record.");
  return { kind: "domain", query: host };
}

const REFERRAL = /^\s*(?:refer|whois|ReferralServer|Registrar WHOIS Server):\s*(?:r?whois:\/\/)?([^\s:/]+)/im;

/** The next server to ask, if the response names one and it passes the hostname rules. */
export function referralFrom(text) {
  const m = text.match(REFERRAL);
  if (!m) return null;
  const host = m[1].toLowerCase().replace(/\.$/, "");
  if (!isValidHostname(host) || LOCAL_SUFFIXES.some(s => host.endsWith(s))) return null;
  return host;
}

const encoder = new TextEncoder();

/** One WHOIS exchange. connect() comes from cloudflare:sockets (injected for tests).
 *  WHOIS FIX (kept from the prototype): write the query line and do NOT close or half-close
 *  the writable side. Ending the write side right after the query made some WHOIS servers
 *  drop the connection before answering. Read until the server closes, the byte cap is hit
 *  or the deadline passes; then close the socket. */
export async function exchange(connect, hostname, query, { timeoutMs = 4000, maxBytes = 102400 } = {}) {
  const socket = connect({ hostname, port: 43 }, { secureTransport: "off", allowHalfOpen: false });
  let timer;
  const deadline = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("timeout")), timeoutMs); });
  const chunks = [];
  let size = 0;
  const reader = socket.readable.getReader();
  try {
    const writer = socket.writable.getWriter();
    await Promise.race([writer.write(encoder.encode(`${query}\r\n`)), deadline]);
    writer.releaseLock(); // release, but never close: see the comment above
    for (;;) {
      const { value, done } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      chunks.push(value);
      size += value.byteLength;
      if (size >= maxBytes) { await reader.cancel().catch(() => {}); break; }
    }
  } finally {
    clearTimeout(timer);
    try { reader.releaseLock(); } catch {}
    try { await socket.close(); } catch {}
  }
  const all = new Uint8Array(Math.min(size, maxBytes));
  let off = 0;
  for (const c of chunks) { const n = Math.min(c.byteLength, all.length - off); all.set(c.subarray(0, n), off); off += n; if (off >= all.length) break; }
  return new TextDecoder().decode(all);
}

/** Ask IANA, then follow referrals. Hops are sequential: at most one socket open at a time. */
export async function lookup(connect, { kind, query }, { maxHops = 3, hopTimeoutMs = 4000, totalTimeoutMs = 9000, maxBytesPerHop = 102400, now = () => Date.now() } = {}) {
  const started = now();
  const hops = [];
  let server = "whois.iana.org";
  while (server && hops.length < maxHops) {
    const left = totalTimeoutMs - (now() - started);
    if (left <= 0) break;
    const q = server === "whois.arin.net" && kind === "ip" ? `n + ${query}` : query;
    let text;
    try {
      text = await exchange(connect, server, q, { timeoutMs: Math.min(hopTimeoutMs, left), maxBytes: maxBytesPerHop });
    } catch (e) {
      hops.push({ server, error: e.message === "timeout" ? "timeout" : "connect-failed", text: "" });
      break;
    }
    hops.push({ server, text });
    const next = referralFrom(text);
    server = next && !hops.some(h => h.server === next) ? next : null;
  }
  return hops;
}

// ---------- output: whitelisted fields only ----------

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE = /(\+?\d[\d\s().-]{6,}\d)/;
const PERSONAL_KEYS = /^(registrant|admin|tech|billing|abuse|owner|person|role|nic-hdl|contact|e-?mail|phone|fax|address|street|city|postal|zip|remarks?|descr|notify|mnt-|changed|source|org-?type|tech-c|admin-c)/i;

// Keys whose values are number ranges or dates, which the phone pattern would misread.
const NUMERIC_KEYS = /^(NetRange|inetnum|inet6num|CIDR|route6?|Creation Date|Updated Date|Registry Expiry Date|Registrar Registration Expiration Date|Expiry Date|created|last-modified|expires|Registrar IANA ID|RegDate|Updated)$/i;

/** Drop personal-data lines before anything is parsed. */
export function scrub(text) {
  return text.split(/\r?\n/).filter(line => {
    const key = line.split(":")[0].trim();
    if (EMAIL.test(line)) return false;
    if (PERSONAL_KEYS.test(key)) return false;
    if (!NUMERIC_KEYS.test(key) && PHONE.test(line)) return false;
    return true;
  }).join("\n");
}

const first = (texts, re) => { for (const t of texts) { const m = t.match(re); if (m) return m[1].trim(); } return null; };
const all = (texts, re) => [...new Set(texts.flatMap(t => [...t.matchAll(re)].map(m => m[1].trim())))];

export const STATUS_MEANINGS = {
  clienttransferprohibited: "The registrar has locked the domain against transfers to another registrar.",
  servertransferprohibited: "The registry has locked the domain against transfers.",
  clientdeleteprohibited: "The registrar has blocked deletion of the domain.",
  serverdeleteprohibited: "The registry has blocked deletion of the domain.",
  clientupdateprohibited: "The registrar has blocked changes to the domain's details.",
  serverupdateprohibited: "The registry has blocked changes to the domain's details.",
  clientrenewprohibited: "The registrar has blocked renewal of the domain.",
  serverrenewprohibited: "The registry has blocked renewal of the domain.",
  clienthold: "The registrar has taken the domain out of DNS, so it doesn't resolve.",
  serverhold: "The registry has taken the domain out of DNS, so it doesn't resolve.",
  ok: "No restrictions are set. This is the normal state.",
  active: "The domain is active.",
  inactive: "The domain has no name servers, so it doesn't resolve.",
  pendingdelete: "The domain is about to be deleted and released.",
  pendingtransfer: "A transfer to another registrar is in progress.",
  redemptionperiod: "The domain has expired and can only be restored by the previous holder, for a fee.",
  autorenewperiod: "The domain was renewed automatically and the renewal can still be reversed.",
  addperiod: "The domain was registered recently.",
};

export function summarize(hops, kind) {
  const texts = hops.filter(h => h.text).map(h => scrub(h.text)).reverse(); // most specific first
  if (kind === "domain") {
    const statuses = all(texts, /^\s*Domain Status:\s*([A-Za-z]+)/gim).map(s => ({ code: s, meaning: STATUS_MEANINGS[s.toLowerCase()] || null }));
    return {
      kind,
      fields: {
        domain: first(texts, /^\s*Domain Name:\s*(\S+)/im)?.toLowerCase() || null,
        registrar: first(texts, /^\s*Registrar:\s*(.+)$/im),
        registrarIanaId: first(texts, /^\s*Registrar IANA ID:\s*(\d+)/im),
        created: first(texts, /^\s*(?:Creation Date|created):\s*(\S+)/im),
        updated: first(texts, /^\s*(?:Updated Date|last-modified|changed):\s*(\S+)/im),
        expires: first(texts, /^\s*(?:Registry Expiry Date|Registrar Registration Expiration Date|Expiry Date|expires):\s*(\S+)/im),
        dnssec: first(texts, /^\s*DNSSEC:\s*(.+)$/im),
      },
      statuses,
      nameServers: all(texts, /^\s*(?:Name Server|nserver):\s*(\S+)/gim).map(s => s.toLowerCase()),
    };
  }
  return {
    kind,
    fields: {
      range: first(texts, /^\s*(?:NetRange|inetnum|inet6num):\s*(.+)$/im),
      cidr: first(texts, /^\s*(?:CIDR|route6?):\s*(.+)$/im),
      name: first(texts, /^\s*(?:NetName|netname):\s*(\S+)/im),
      handle: first(texts, /^\s*NetHandle:\s*(\S+)/im),
      organization: first(texts, /^\s*(?:OrgName|org-name|Organization):\s*(.+)$/im),
      country: first(texts, /^\s*(?:Country|country):\s*([A-Za-z]{2})\b/m),
      type: first(texts, /^\s*(?:NetType|status):\s*(.+)$/im),
    },
    statuses: [],
    nameServers: [],
  };
}
