// Reverse DNS (PTR) for the visitor's own IP, via one DNS-over-HTTPS query to Cloudflare.
import { ptrName } from "./ip.js";

export async function reverseLookup(fetchImpl, ip, { timeoutMs = 2000 } = {}) {
  const name = ptrName(ip);
  if (!name) return { hostname: null, status: "invalid" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=PTR`, {
      headers: { accept: "application/dns-json" }, signal: ctrl.signal,
    });
    if (!res.ok) return { hostname: null, status: "error" };
    const d = await res.json();
    const ptr = (d.Answer || []).find(a => a.type === 12);
    if (!ptr) return { hostname: null, status: d.Status === 3 ? "none" : "none" };
    const host = String(ptr.data).replace(/\.$/, "").toLowerCase();
    return /^[a-z0-9.-]{1,253}$/.test(host) ? { hostname: host, status: "ok" } : { hostname: null, status: "none" };
  } catch (e) {
    return { hostname: null, status: e.name === "AbortError" ? "timeout" : "error" };
  } finally {
    clearTimeout(timer);
  }
}
