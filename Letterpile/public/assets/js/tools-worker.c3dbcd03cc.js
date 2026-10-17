/* Word tools worker: runs js/wordtools.js searches off the main thread. It loads the same
   engine.js and word file as the site's search worker, plus the common-words list and wordtools.js. */
"use strict";
let ready = null, clean = null, common = null;
self.onmessage = e => {
  const m = e.data;
  if (m.type === "init") {
    if (!ready) {
      ready = new Promise((resolve, reject) => {
        try {
          self.importScripts(m.engine, m.words, m.common, m.tools);
          self.Engine.load().then(resolve, reject);
        } catch (err) { reject(err); }
      });
    }
    return;
  }
  (ready || Promise.reject(new Error("Worker not initialized")))
    .then(() => {
      const E = self.Engine;
      if (!clean) clean = E.words.filter(w => !E.isHidden(w));
      if (!common) { common = self.WordTools.commonMap(self.COMMON_WORDS); delete self.COMMON_WORDS; }
      self.WordTools.use(m.showAll ? E.words : clean, common);
      self.postMessage({ id: m.id, result: self.WordTools[m.fn](...m.args) });
    })
    .catch(err => self.postMessage({ id: m.id, error: String(err && err.message || err) }));
};
