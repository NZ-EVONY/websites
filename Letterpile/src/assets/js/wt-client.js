/* Word tools client: runs js/wordtools.js searches in js/tools-worker.js (or on the page). */
(function (root) {
  "use strict";
  const doc = root.document, me = doc.currentScript;
  const engineEl = doc.querySelector("script[data-worker]");
  const api = {};
  let worker = null, ready = false, seq = 0;
  const pending = new Map();
  const abs = u => new URL(u, location.href).href;
  const start = () => {
    if (worker || !engineEl || !("Worker" in root)) return worker;
    try {
      worker = new Worker(me.dataset.worker);
      worker.onmessage = e => {
        const p = pending.get(e.data.id);
        if (!p) return;
        pending.delete(e.data.id);
        ready = true;
        e.data.error ? p.reject(new Error(e.data.error)) : p.resolve(e.data.result);
      };
      worker.onerror = () => { for (const p of pending.values()) p.reject(new Error("Couldn't load the word list.")); pending.clear(); worker = null; };
      worker.postMessage({ type: "init", engine: abs(engineEl.src), words: abs(engineEl.dataset.words), common: abs(me.dataset.common), tools: abs(me.dataset.core) });
    } catch { worker = null; }
    return worker;
  };
  const script = src => new Promise((resolve, reject) => {
    const s = doc.createElement("script");
    s.src = src; s.onload = resolve; s.onerror = () => reject(new Error("Couldn't load the word list."));
    doc.head.appendChild(s);
  });
  // Without workers: the same searches on the page.
  let local = null, clean = null;
  const loadLocal = () => local || (local = Promise.all([root.Engine.load(), script(me.dataset.common), script(me.dataset.core)]).then(() => {
    const map = root.WordTools.commonMap(root.COMMON_WORDS);
    delete root.COMMON_WORDS;
    return map;
  }));
  const Engine = () => root.Engine;
  api.compute = (fn, ...args) => {
    const w = start();
    if (!w) return loadLocal().then(map => {
      const E = Engine(), T = root.WordTools;
      if (!clean) clean = E.words.filter(x => !E.isHidden(x));
      T.use(E.showAll ? E.words : clean, map);
      ready = true;
      return T[fn](...args);
    });
    return new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      w.postMessage({ id, fn, args, showAll: !!Engine()?.showAll });
    });
  };
  api.isReady = () => ready;
  // Like UI.withWords: a loading message the first time; current() is false once a newer
  // search has started on the same element.
  api.run = async (el, fn) => {
    const tok = (el._searchToken = (el._searchToken || 0) + 1);
    const current = () => el._searchToken === tok;
    if (!ready) el.innerHTML = `<p class="loading">Loading the word list…</p>`;
    try { await fn(current); } catch (e) { if (current()) el.innerHTML = `<p class="error">${String(e.message).replace(/[<&]/g, "")} Check your connection and try again.</p>`; }
  };
  // Re-run when the "show all words" box changes (site.js stores the choice).
  api.onFilter = fn => doc.querySelectorAll("[data-show-all]").forEach(b => b.addEventListener("change", () => setTimeout(fn)));
  // Warm the worker as soon as someone starts using the form.
  doc.querySelectorAll(".tool-form, [data-warm]").forEach(f => ["pointerdown", "keydown", "input"].forEach(t => f.addEventListener(t, () => { api.compute("isWord", "a").catch(() => {}); }, { once: true, passive: true })));
  root.WordToolsClient = api;
})(window);
