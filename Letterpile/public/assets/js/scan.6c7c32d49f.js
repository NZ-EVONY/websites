(function () {
  "use strict";
  const me = document.currentScript;
  const input = document.querySelector(me.dataset.target);
  if (!input) return;
  const base = me.dataset.tesseract;

  const btn = document.querySelector(".scan-btn"); // in the page's HTML (see layout.mjs)
  if (!btn) return;
  const file = document.createElement("input");
  file.type = "file"; file.accept = "image/*"; file.setAttribute("capture", "environment"); file.hidden = true;
  file.setAttribute("aria-label", "Photo of your tiles");
  btn.after(file);

  const dlg = document.createElement("dialog");
  dlg.className = "scan"; dlg.setAttribute("aria-labelledby", "scanTitle");
  dlg.innerHTML = `<h2 id="scanTitle">Scan tiles</h2>
    <canvas class="scan-img" aria-hidden="true"></canvas>
    <p class="scan-status" role="status" aria-live="polite"></p>
    <label class="field"><span>Letters found: check and edit them</span><input type="text" class="big-input scan-out" autocomplete="off" spellcheck="false"></label>
    <p class="hint">Reading happens on this device; the photo isn't uploaded. Use ? for a blank tile.</p>
    <div class="row"><button type="button" class="btn scan-use" disabled>Use these letters</button><button type="button" class="btn secondary scan-again">Another photo</button><button type="button" class="btn secondary scan-cancel">Cancel</button></div>`;
  document.body.append(dlg);
  const $ = s => dlg.querySelector(s);
  const status = t => { $(".scan-status").textContent = t; };

  btn.addEventListener("click", () => file.click());
  $(".scan-again").addEventListener("click", () => file.click());
  $(".scan-cancel").addEventListener("click", () => dlg.close());
  $(".scan-use").addEventListener("click", () => {
    input.value = $(".scan-out").value.toUpperCase().replace(/[^A-Z?]/g, "").slice(0, input.maxLength > 0 ? input.maxLength : 30);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    dlg.close();
    input.focus();
  });
  $(".scan-out").addEventListener("input", e => { $(".scan-use").disabled = !e.target.value.trim(); });

  let reader = null;
  const loadReader = () => reader || (reader = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = me.dataset.reader;
    s.onload = () => resolve(window.LPScan);
    s.onerror = () => { reader = null; reject(new Error("Couldn't load the scanner.")); };
    document.head.append(s);
  }));
  file.addEventListener("change", async () => {
    const f = file.files[0];
    file.value = "";
    if (!f) return;
    if (!dlg.open) dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
    $(".scan-out").value = ""; $(".scan-use").disabled = true;
    status("Opening the photo…");
    try {
      const read = await loadReader();
      const text = await read(f, { base, status, preview: $(".scan-img") });
      $(".scan-out").value = text;
      $(".scan-use").disabled = !text;
      status(text ? `Found ${text.length} letter${text.length === 1 ? "" : "s"}${text.includes("?") ? " (? marks a tile it couldn't read; type the letter, or leave ? for a blank)" : ""}. Check them against your tiles.` : "No letters found. Try a closer, well-lit photo, straight on, or type the letters.");
      $(".scan-out").focus();
    } catch (e) {
      status(`${e.message || "Something went wrong."} You can type the letters instead.`);
    }
  });
})();
