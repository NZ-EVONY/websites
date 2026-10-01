// IP address parsing, normalisation and classification. Used by every Worker route.
// No regex shortcuts for IPv6: addresses are parsed into bytes, so spellings such as
// "::ffff:7f00:1", "0:0:0:0:0:0:0:1" or "64:ff9b::7f00:1" are classified correctly.

const V4_PART = /^(0|[1-9]\d{0,2})$/; // no leading zeros ("01" is rejected)
const HEX_GROUP = /^[0-9a-f]{1,4}$/i;

function parseV4(s) {
  const parts = s.split(".");
  if (parts.length !== 4) return null;
  const bytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    if (!V4_PART.test(parts[i])) return null;
    const n = Number(parts[i]);
    if (n > 255) return null;
    bytes[i] = n;
  }
  return bytes;
}

function parseV6(s) {
  if (!/^[0-9a-fA-F:.]+$/.test(s) || !s.includes(":")) return null;
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const toGroups = part => (part === "" ? [] : part.split(":"));
  const head = toGroups(halves[0]);
  const tail = halves.length === 2 ? toGroups(halves[1]) : [];
  const all = halves.length === 2 ? [...head, ...tail] : head;
  // An embedded IPv4 tail may only appear as the very last element.
  let v4 = null;
  if (all.length && all.at(-1).includes(".")) {
    v4 = parseV4(all.at(-1));
    if (!v4) return null;
  }
  const hexCount = all.length - (v4 ? 1 : 0);
  for (let i = 0; i < hexCount; i++) if (!HEX_GROUP.test(all[i])) return null;
  const groupsUsed = hexCount + (v4 ? 2 : 0);
  if (halves.length === 2) {
    if (groupsUsed > 7) return null; // "::" must stand for at least one zero group
  } else if (groupsUsed !== 8) return null;
  const words = [];
  const pushHex = arr => arr.forEach(g => words.push(parseInt(g, 16)));
  const headHex = halves.length === 2 ? head : all.slice(0, hexCount);
  const tailHex = halves.length === 2 ? (v4 ? tail.slice(0, -1) : tail) : [];
  if (halves.length === 2 && v4 && tail.length === 0) return null; // "1.2.3.4::" is not valid
  pushHex(headHex);
  if (halves.length === 2) for (let i = 0; i < 8 - groupsUsed; i++) words.push(0);
  pushHex(tailHex);
  if (v4) words.push((v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]);
  if (words.length !== 8) return null;
  const bytes = new Uint8Array(16);
  words.forEach((w, i) => { bytes[2 * i] = w >> 8; bytes[2 * i + 1] = w & 0xff; });
  return bytes;
}

/** Parse an IP literal. Returns { version: 4|6, bytes } or null. Zone ids, brackets, ports,
 *  whitespace and partial forms ("1.2.3", "01.2.3.4") are rejected. */
export function parseIP(input) {
  if (typeof input !== "string" || input.length === 0 || input.length > 45) return null;
  if (input.includes(":")) {
    const bytes = parseV6(input);
    return bytes ? { version: 6, bytes } : null;
  }
  const bytes = parseV4(input);
  return bytes ? { version: 4, bytes } : null;
}

const v4String = b => `${b[0]}.${b[1]}.${b[2]}.${b[3]}`;

function v6String(b) {
  const w = [];
  for (let i = 0; i < 16; i += 2) w.push((b[i] << 8) | b[i + 1]);
  // RFC 5952: compress the longest run (length >= 2) of zero groups, leftmost on a tie.
  let best = -1, bestLen = 0;
  for (let i = 0; i < 8;) {
    if (w[i] !== 0) { i++; continue; }
    let j = i;
    while (j < 8 && w[j] === 0) j++;
    if (j - i > bestLen && j - i >= 2) { best = i; bestLen = j - i; }
    i = j;
  }
  const hex = w.map(x => x.toString(16));
  if (best < 0) return hex.join(":");
  return `${hex.slice(0, best).join(":")}::${hex.slice(best + bestLen).join(":")}`;
}

const isMapped = b => b.slice(0, 10).every(x => x === 0) && b[10] === 0xff && b[11] === 0xff;

/** Canonical text form: dotted IPv4, or lowercase compressed IPv6 (RFC 5952). IPv4-mapped
 *  IPv6 (::ffff:a.b.c.d) is unwrapped to plain IPv4. Returns null for invalid input. */
export function normalizeIP(input) {
  const p = typeof input === "string" ? parseIP(input) : input;
  if (!p) return null;
  if (p.version === 4) return v4String(p.bytes);
  if (isMapped(p.bytes)) return v4String(p.bytes.slice(12));
  return v6String(p.bytes);
}

function inPrefix(bytes, prefix, bits) {
  for (let i = 0; i < bits; i++) {
    const byte = i >> 3, mask = 0x80 >> (i & 7);
    if ((bytes[byte] & mask) !== (prefix[byte] & mask)) return false;
  }
  return true;
}

const v4 = (s, bits) => [parseV4(s), bits];
const v6 = (s, bits) => [parseV6(s), bits];

// Not globally routable (special-purpose ranges). Sources: IANA IPv4/IPv6 Special-Purpose
// Address Registries (see docs/UNVERIFIED.md: the registries could not be fetched from the
// build environment; ranges cross-checked against Python's ipaddress module).
export const V4_BLOCKED = [
  v4("0.0.0.0", 8), v4("10.0.0.0", 8), v4("100.64.0.0", 10), v4("127.0.0.0", 8),
  v4("169.254.0.0", 16), v4("172.16.0.0", 12), v4("192.0.0.0", 24), v4("192.0.2.0", 24),
  v4("192.88.99.0", 24), v4("192.168.0.0", 16), v4("198.18.0.0", 15), v4("198.51.100.0", 24),
  v4("203.0.113.0", 24), v4("224.0.0.0", 4), v4("240.0.0.0", 4), v4("255.255.255.255", 32),
];
export const V6_BLOCKED = [
  v6("::", 128), v6("::1", 128),
  v6("::", 96),            // deprecated IPv4-compatible addresses (::a.b.c.d)
  v6("64:ff9b:1::", 48),   // local-use NAT64
  v6("100::", 64),         // discard-only
  v6("2001::", 32),        // Teredo
  v6("2001:2::", 48),      // benchmarking
  v6("2001:db8::", 32),    // documentation
  v6("2002::", 16),        // 6to4 (deprecated; rejected as a whole)
  v6("3fff::", 20),        // documentation (RFC 9637)
  v6("fc00::", 7),         // unique local
  v6("fe80::", 10),        // link-local
  v6("fec0::", 10),        // site-local (deprecated)
  v6("ff00::", 8),         // multicast
];

/** True only for addresses that are reachable on the public internet. IPv4-mapped
 *  (::ffff:0:0/96) and NAT64 (64:ff9b::/96) addresses are unwrapped and tested as IPv4. */
export function isGloballyRoutable(input) {
  const p = typeof input === "string" ? parseIP(input) : input;
  if (!p) return false;
  if (p.version === 4) return !V4_BLOCKED.some(([pre, bits]) => inPrefix(p.bytes, pre, bits));
  const b = p.bytes;
  if (isMapped(b)) return isGloballyRoutable({ version: 4, bytes: b.slice(12) });
  if (inPrefix(b, parseV6("64:ff9b::"), 96)) return isGloballyRoutable({ version: 4, bytes: b.slice(12) });
  return !V6_BLOCKED.some(([pre, bits]) => inPrefix(b, pre, bits));
}

/** The one and only source of the visitor's IP: the CF-Connecting-IP header Cloudflare sets.
 *  X-Forwarded-For, X-Real-IP, True-Client-IP, Forwarded and everything else are ignored.
 *  In local development only (env.ENVIRONMENT === "dev"), env.DEV_FAKE_IP may stand in. */
export function getClientIp(request, env = {}) {
  if (env.ENVIRONMENT === "dev" && env.DEV_FAKE_IP) {
    const fake = normalizeIP(String(env.DEV_FAKE_IP).trim());
    if (fake) return fake;
  }
  const raw = request.headers.get("cf-connecting-ip");
  if (!raw) return null;
  return normalizeIP(raw.trim());
}

export const ipVersion = ip => (parseIP(ip)?.version ?? null);

/** Reverse-DNS name for an IP (in-addr.arpa / ip6.arpa). */
export function ptrName(ip) {
  const p = parseIP(ip);
  if (!p) return null;
  if (p.version === 4) return `${[...p.bytes].reverse().join(".")}.in-addr.arpa`;
  const nibbles = [];
  for (const byte of p.bytes) nibbles.push((byte >> 4).toString(16), (byte & 15).toString(16));
  return `${nibbles.reverse().join(".")}.ip6.arpa`;
}
