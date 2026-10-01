/* Letterpile search worker: runs engine.js searches off the main thread so long searches
   (for example two-word anagrams) never freeze the page. Loaded by site.js; the page
   falls back to running the same engine on the main thread if workers are unavailable. */
"use strict";
let ready = null;
self.onmessage = e => {
  const m = e.data;
  if (m.type === "init") {
    if (!ready) {
      ready = new Promise((resolve, reject) => {
        try {
          self.importScripts(m.engine, m.words);
          self.Engine.load().then(resolve, reject);
        } catch (err) { reject(err); }
      });
    }
    return;
  }
  (ready || Promise.reject(new Error("Worker not initialized")))
    .then(() => {
      self.Engine.setShowAll(!!m.showAll);
      self.postMessage({ id: m.id, result: self.Engine[m.fn](...m.args) });
    })
    .catch(err => self.postMessage({ id: m.id, error: String(err && err.message || err) }));
};
