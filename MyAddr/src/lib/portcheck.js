// Port checker for the visitor's OWN public IP. The target is never taken from the request
// body, query string or any header other than CF-Connecting-IP (via getClientIp).
// It only opens a TCP connection and closes it: no data is sent, no banner is read.

export const ALLOWED_BODY_KEYS = new Set(["ports", "ack"]);

/** Validate the JSON body. Returns { ports } or { error }. */
export function validateBody(body, allowedPorts) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "The request body must be a JSON object." };
  for (const k of Object.keys(body)) if (!ALLOWED_BODY_KEYS.has(k)) return { error: `Unexpected field "${String(k).slice(0, 20)}". Only "ports" and "ack" are accepted.` };
  if (body.ack !== true) return { error: "Please tick the box to confirm you're testing your own connection." };
  if (!Array.isArray(body.ports) || body.ports.length === 0) return { error: "Choose at least one port." };
  if (body.ports.length > allowedPorts.length) return { error: "Too many ports." };
  const seen = new Set();
  for (const p of body.ports) {
    if (!Number.isInteger(p) || !allowedPorts.includes(p)) return { error: "Only the ports listed on the page can be checked." };
    if (seen.has(p)) return { error: "Each port can only be listed once." };
    seen.add(p);
  }
  return { ports: [...seen] };
}

const BLOCKED = /proxy request failed|cannot connect to the specified address|prohibited/i;

/** Check one port. Returns "open", "closed" (failed quickly: closed or refused),
 *  "no-response" (timed out) or "blocked" (the platform refuses to connect to this address). */
export async function checkOne(connect, ip, port, { timeoutMs = 2500 } = {}) {
  let socket, timer;
  try {
    socket = connect({ hostname: ip, port }, { secureTransport: "off", allowHalfOpen: false });
    const timeout = new Promise(resolve => { timer = setTimeout(() => resolve("no-response"), timeoutMs); });
    const opened = socket.opened.then(() => "open", e => (BLOCKED.test(String(e?.message || e)) ? "blocked" : "closed"));
    return await Promise.race([opened, timeout]);
  } catch (e) {
    return BLOCKED.test(String(e?.message || e)) ? "blocked" : "closed";
  } finally {
    clearTimeout(timer);
    try { socket?.close(); } catch {}
  }
}

/** Check several ports with at most `maxInFlight` sockets open at once and an overall deadline. */
export async function checkPorts(connect, ip, ports, { maxInFlight = 5, timeoutMs = 2500, deadlineMs = 8000, now = () => Date.now() } = {}) {
  const started = now();
  const results = new Map();
  const queue = [...ports];
  async function worker() {
    while (queue.length) {
      const port = queue.shift();
      if (now() - started > deadlineMs - timeoutMs) { results.set(port, "no-response"); continue; }
      results.set(port, await checkOne(connect, ip, port, { timeoutMs }));
    }
  }
  await Promise.all(Array.from({ length: Math.min(maxInFlight, ports.length) }, worker));
  return ports.map(port => ({ port, status: results.get(port) || "no-response" }));
}
