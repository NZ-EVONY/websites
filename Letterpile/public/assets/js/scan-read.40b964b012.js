(function () {
  "use strict";
  let base = "", status = () => {}, $ = null;
  let lib = null;
  const loadLib = () => lib || (lib = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `${base}/tesseract.min.js`;
    s.onload = () => resolve(window.Tesseract);
    s.onerror = () => { lib = null; reject(new Error("Couldn't load the scanner.")); };
    document.head.append(s);
  }));
  let worker = null;
  async function getWorker() {
    if (worker) return worker;
    const T = await loadLib();
    worker = await T.createWorker("eng", 1, {
      workerPath: `${base}/worker.min.js`, corePath: `${base}/core`, langPath: `${base}/lang`, workerBlobURL: false,
      logger: m => { if (/load/.test(m.status)) status("Loading the scanner (first time only)…"); },
    });
    await worker.setParameters({ tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ" });
    return worker;
  }


  function gray(img, max) {
    const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height, k = Math.min(1, max / w0);
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
    const x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(img, 0, 0, c.width, c.height);
    const p = x.getImageData(0, 0, c.width, c.height).data, g = new Uint8Array(c.width * c.height);
    for (let i = 0; i < g.length; i++) g[i] = (p[i * 4] * 299 + p[i * 4 + 1] * 587 + p[i * 4 + 2] * 114) / 1000;
    return { g, w: c.width, h: c.height };
  }
  function otsu(g, keep = () => true) {
    const hist = new Array(256).fill(0);
    let n = 0;
    for (let i = 0; i < g.length; i++) if (keep(i)) { hist[g[i]]++; n++; }
    let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sB = 0, wB = 0, best = -1, t = 128;
    for (let i = 0; i < 256; i++) {
      wB += hist[i]; if (!wB) continue;
      const wF = n - wB; if (!wF) break;
      sB += i * hist[i];
      const v = wB * wF * (sB / wB - (sum - sB) / wF) ** 2;
      if (v > best) { best = v; t = i; }
    }
    return t;
  }
  function regions(w, h, on, x0 = 0, y0 = 0, x1 = w, y1 = h) {
    const seen = new Uint8Array(w * h), out = [], stack = [];
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = y * w + x;
      if (seen[i] || !on(i)) continue;
      const r = { x0: x, y0: y, x1: x, y1: y, n: 0 };
      seen[i] = 1; stack.push(i);
      while (stack.length) {
        const j = stack.pop(), jx = j % w, jy = (j - jx) / w;
        r.n++; if (jx < r.x0) r.x0 = jx; if (jx > r.x1) r.x1 = jx; if (jy < r.y0) r.y0 = jy; if (jy > r.y1) r.y1 = jy;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = jx + dx, ny = jy + dy;
          if (nx < x0 || ny < y0 || nx >= x1 || ny >= y1) continue;
          const k = ny * w + nx;
          if (!seen[k] && on(k)) { seen[k] = 1; stack.push(k); }
        }
      }
      out.push(r);
    }
    return out;
  }
  function letters(img) {
    const { g, w, h } = gray(img, 900);
    const t = otsu(g);
    const minSide = Math.min(w, h) * 0.04;
    const tiles = regions(w, h, i => g[i] > t).filter(r => {
      const bw = r.x1 - r.x0 + 1, bh = r.y1 - r.y0 + 1;
      return bw > minSide && bh > minSide && bw / bh > 0.5 && bw / bh < 2 && r.n > bw * bh * 0.5 && bw < w * 0.6;
    });
    const out = [];
    for (const r of tiles) {
      const inTile = i => { const x = i % w, y = (i - x) / w; return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1; };
      const lt = otsu(g, inTile);
      const blobs = regions(w, h, i => g[i] <= lt, r.x0 + 1, r.y0 + 1, r.x1, r.y1)
        .filter(b => b.x0 > r.x0 + 1 && b.y0 > r.y0 + 1 && b.x1 < r.x1 - 1 && b.y1 < r.y1 - 1);
      if (!blobs.length) continue;
      const L = blobs.reduce((a, b) => ((b.y1 - b.y0) * (b.x1 - b.x0) > (a.y1 - a.y0) * (a.x1 - a.x0) ? b : a));
      if (L.y1 - L.y0 < (r.y1 - r.y0) * 0.25) continue;
      const c = document.createElement("canvas"), pad = 12, lw = L.x1 - L.x0 + 1, lh = L.y1 - L.y0 + 1, k = 64 / lh;
      c.width = Math.round(lw * k) + pad * 2; c.height = 64 + pad * 2;
      const x = c.getContext("2d");
      x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
      const d = x.getImageData(0, 0, c.width, c.height);
      for (let yy = 0; yy < 64; yy++) for (let xx = 0; xx < c.width - pad * 2; xx++) {
        const sx = L.x0 + Math.min(lw - 1, Math.floor(xx / k)), sy = L.y0 + Math.min(lh - 1, Math.floor(yy / k));
        if (g[sy * w + sx] <= lt) { const o = ((yy + pad) * c.width + xx + pad) * 4; d.data[o] = d.data[o + 1] = d.data[o + 2] = 0; }
      }
      x.putImageData(d, 0, 0);
      out.push({ c, cx: (r.x0 + r.x1) / 2, cy: (r.y0 + r.y1) / 2, size: r.y1 - r.y0 });
    }
    out.sort((a, b) => (Math.abs(a.cy - b.cy) < a.size / 2 ? a.cx - b.cx : a.cy - b.cy));
    const pv = $(), x = pv.getContext("2d");
    pv.width = w; pv.height = h;
    const id = x.createImageData(w, h);
    for (let i = 0; i < g.length; i++) { id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = g[i]; id.data[i * 4 + 3] = 255; }
    x.putImageData(id, 0, 0);
    return out.map(o => o.c);
  }

  window.LPScan = async (f, opts) => {
    base = opts.base; status = opts.status; $ = () => opts.preview;
    const img = await (window.createImageBitmap ? createImageBitmap(f) : new Promise((resolve, reject) => {
      const r = new FileReader(), im = new Image();
      r.onload = () => { im.onload = () => resolve(im); im.onerror = reject; im.src = r.result; };
      r.onerror = reject;
      r.readAsDataURL(f);
    })).catch(() => { throw new Error("That file isn't a photo this browser can open."); });
    const tiles = letters(img);
    const w = await getWorker();
    let text = "";
    if (tiles.length) {
      const strip = document.createElement("canvas");
      strip.width = tiles.reduce((n, c) => n + c.width + 24, 24); strip.height = 88;
      const sx = strip.getContext("2d");
      sx.fillStyle = "#fff"; sx.fillRect(0, 0, strip.width, strip.height);
      tiles.reduce((x, c) => { sx.drawImage(c, x, 0); return x + c.width + 24; }, 24);
      for (const psm of ["7", "13"]) {
        await w.setParameters({ tessedit_pageseg_mode: psm });
        const { data } = await w.recognize(strip);
        text = (data.text || "").toUpperCase().replace(/[^A-Z]/g, "");
        if (text.length === tiles.length) break;
      }
      if (text.length !== tiles.length) {
        text = "";
        for (const [i, c] of tiles.entries()) {
          status(`Reading tile ${i + 1} of ${tiles.length}…`);
          let ch = "";
          for (const psm of ["10", "8", "13"]) {
            await w.setParameters({ tessedit_pageseg_mode: psm });
            ch = ((await w.recognize(c)).data.text || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 1);
            if (ch) break;
          }
          text += ch || "?";
        }
      }
    } else {
      await w.setParameters({ tessedit_pageseg_mode: "11" });
      const { data } = await w.recognize($());
      text = (data.text || "").toUpperCase().replace(/[^A-Z]/g, "");
    }
    return text;
  };
})();
