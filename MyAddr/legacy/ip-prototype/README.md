# MyAddr — a "what's my IP" site

A dependency-free take on sites like whatsmyip.com, with its own branding and copy. Most of it runs in the browser. A small Node server adds the tools a web page can't do on its own.

## Features

- **Your IP**: public IPv4 and IPv6 addresses, each with a copy button.
- **Your connection**: approximate city, region and country, plus ISP, ASN, time zone, coordinates and postal code.
- **IP lookup** for any public IPv4 or IPv6 address, with an OpenStreetMap link.
- **DNS lookup** over HTTPS for A, AAAA, CNAME, MX, NS, TXT, SOA and CAA records. You can paste a full URL and it will pull out the domain.
- **Password generator** using `crypto.getRandomValues`, with rejection sampling so no character is favoured, at least one character from each set you pick, and an entropy meter.
- **Browser info**: user agent, OS, screen, language, time zone and connection.
- **WHOIS** for domains and IP blocks. It starts at IANA and follows referrals to the registry and registrar, or to the regional registry for IPs, then pulls out the key fields: registrar, dates, status, organisation, network range and name servers. *(needs the server)*
- **Port checker** for up to 25 TCP ports or ranges, with presets for web, remote access, mail, databases and games. *(needs the server)*
- **Ping and traceroute**, with output streamed live and a Stop button. *(needs the server)*
- Light and dark themes (it follows your system setting, or you can switch it). Works on phones.

## Data sources

All of these are free, need no API key and allow browser requests from other sites. Each has a fallback.

| Purpose | Primary | Fallback |
|---|---|---|
| IPv4 | api.ipify.org | ipv4.icanhazip.com |
| IPv6 | api64.ipify.org | — |
| Geolocation | ipwho.is | ipapi.co |
| DNS | cloudflare-dns.com (DoH JSON) | dns.google |

## Run it

You need Node 18 or newer. There's nothing to install.

```sh
node server.js                 # http://127.0.0.1:8000
```

| Setting | Default | Effect |
|---|---|---|
| `PORT` | `8000` | Port to listen on |
| `HOST` | `127.0.0.1` | Use `0.0.0.0` to open it to other devices on your network |
| `ALLOW_PRIVATE` | off | `1` lets the tools reach LAN and loopback addresses (192.168.x, 10.x, 127.x…) |
| `RATE_PER_MIN` | `30` | Tool requests allowed per client per minute |
| `TRUST_PROXY` | off | `1` reads the client IP from `X-Forwarded-For` (only behind a reverse proxy) |

Example, to check ports on your own router: `ALLOW_PRIVATE=1 node server.js`

Ping and traceroute use the system commands. Windows and macOS include them. On Debian or Ubuntu, install them with `sudo apt install iputils-ping traceroute`.

If you open `index.html` directly, without the server, the browser-only tools still work. The four server tools are greyed out, with a note explaining how to start the server.

## Safety

Anything that can ping or port-scan on request can be misused, so the server is cautious by default:

- It only listens on this machine (`127.0.0.1`) unless you set `HOST`.
- It refuses private, loopback and reserved addresses unless you set `ALLOW_PRIVATE=1`.
- It looks up a hostname once, checks the result, and then connects to that exact address, so a second DNS answer can't redirect it.
- Commands run with fixed arguments and never through a shell. Hostnames are checked against a strict pattern.
- Each client is rate-limited, and each request is capped at 25 ports. A command is killed after 60 seconds, or as soon as you press Stop or close the page.
- It only serves the three site files, so `server.js` itself can't be downloaded.

Don't put it on the public internet without a reverse proxy and some thought about who can use it.
