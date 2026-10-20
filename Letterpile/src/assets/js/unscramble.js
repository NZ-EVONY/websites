/* Word Unscrambler page (/). Extracted from the inline script of the live index.html. */
(function () {
  "use strict";
  const { $, withWords, compute, renderGroups, getParams, setParams, esc, letterInput, onWordsFilter } = UI;
  const { letters: MAX, blanks: MAX_BLANKS } = Engine.LIMITS;
  for (let n = 2; n <= 15; n++) $("#len").insertAdjacentHTML("beforeend", `<option>${n}</option>`);
  const clean = s => s.toLowerCase().replace(/[^a-z]/g, "");
  letterInput($("#letters"), { max: MAX + MAX_BLANKS });

  function run() {
    const letters = $("#letters").value.trim();
    const opts = {
      startsWith: clean($("#starts").value), endsWith: clean($("#ends").value),
      contains: clean($("#contains").value), length: +$("#len").value || 0, exact: $("#exact").checked,
    };
    setParams({ letters, starts: opts.startsWith, ends: opts.endsWith, contains: opts.contains, len: opts.length || "", exact: opts.exact });
    const out = $("#results");
    const { letters: l, blanks } = Engine.parseLetters(letters);
    if (l.length + blanks < 2) { out.innerHTML = `<p class="empty">Enter at least two letters.</p>`; return; }
    if (l.length > MAX) { out.innerHTML = `<p class="empty">Use up to ${MAX} letters (plus up to ${MAX_BLANKS} blanks).</p>`; return; }
    const shown = (l + "?".repeat(blanks)).toUpperCase();
    withWords(out, async current => {
      const found = await compute("unscrambleGrouped", letters, opts);
      if (!current()) return;
      if (!found.total) {
        out.innerHTML = `<p class="empty">No words found. Try fewer letters, removing a filter, or adding a <kbd>?</kbd> blank. Check the spelling of your letters too.</p>`;
        return;
      }
      // Big results (blanks can give thousands of words) go in a group or two (up to 200 chips) at a time,
      // yielding between batches, so building and laying them out is never one long main-thread task.
      out.innerHTML = `<p class="summary">${found.total.toLocaleString()} words from <code>${esc(shown)}</code></p>`;
      let batch = [], chips = 0;
      for (const g of found.groups) {
        batch.push(g); chips += g.items.length;
        if (chips < 150) continue;
        out.insertAdjacentHTML("beforeend", renderGroups({ groups: batch }));
        batch = []; chips = 0;
        await new Promise(r => setTimeout(r, 0));
        if (!current()) return;
      }
      if (batch.length) out.insertAdjacentHTML("beforeend", renderGroups({ groups: batch }));
    });
  }

  $("#form").addEventListener("submit", e => { e.preventDefault(); run(); });
  onWordsFilter(() => { if ($("#letters").value.trim()) run(); });
  const p = getParams();
  if (p.letters) {
    $("#letters").value = p.letters; $("#starts").value = p.starts || ""; $("#ends").value = p.ends || "";
    $("#contains").value = p.contains || ""; $("#len").value = p.len || ""; $("#exact").checked = !!p.exact;
    if (p.starts || p.ends || p.contains || p.len || p.exact) $("#adv").open = true;
    run();
  } else $("#letters").focus();
})();
