/* Printables: makes word searches (games/ws-core.js) and sudoku (games/sd-core.js) in the browser,
   shows them, and builds a two-page PDF (puzzle, then answer key) with jsPDF, which loads only
   when a PDF is downloaded. Theme pages carry ready-made puzzles in [data-puzzle]. */
(function () {
  "use strict";
  const WS = window.WSCore, SD = window.SDCore, $ = s => document.querySelector(s);
  const root = $("[data-printables]");
  if (!root || !WS || !SD) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  function wsHtml(p) {
    const cells = [...p.grid].map(ch => `<td>${ch.toUpperCase()}</td>`);
    let rows = "";
    for (let r = 0; r < p.size; r++) rows += `<tr>${cells.slice(r * p.size, r * p.size + p.size).join("")}</tr>`;
    return `<table class="pz-grid pz-${p.size}" aria-label="${esc(p.theme)} word search">${rows}</table><p class="wordlist">${p.words.map(w => esc(w.w.toLowerCase())).join(" ")}</p>`;
  }
  function sdHtml(p) {
    let rows = "";
    for (let r = 0; r < 9; r++) rows += `<tr>${[...p.givens.slice(r * 9, r * 9 + 9)].map(d => `<td>${d === "0" ? "" : d}</td>`).join("")}</tr>`;
    return `<table class="pz-grid pz-sudoku" aria-label="Sudoku">${rows}</table>`;
  }

  let lib = null;
  const loadPdf = () => lib || (lib = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = root.dataset.jspdf;
    s.onload = () => resolve(window.jspdf.jsPDF);
    s.onerror = () => { lib = null; reject(new Error("Couldn't load the PDF maker.")); };
    document.head.append(s);
  }));
  async function pdf(p) {
    const JsPDF = await loadPdf();
    const doc = new JsPDF({ unit: "pt", format: "letter" });
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 54;
    const head = (title, sub) => {
      doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(20); doc.text(title, W / 2, M + 10, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(11); doc.setTextColor(90); doc.text(sub, W / 2, M + 30, { align: "center" });
      doc.setFontSize(9); doc.setTextColor(120); doc.text("Free printable puzzles from letterpile.app", W / 2, H - 30, { align: "center" });
    };
    if (p.kind === "wordsearch") {
      const n = p.size, cell = Math.min((W - 2 * M) / n, 30), x0 = (W - cell * n) / 2, y0 = M + 50;
      const inWord = new Set(p.words.flatMap(w => WS.cellsOf(w, n)));
      const grid = answers => {
        doc.setFont("helvetica", "bold"); doc.setFontSize(cell * 0.55);
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
          const i = r * n + c, x = x0 + c * cell, y = y0 + r * cell;
          if (answers && inWord.has(i)) { doc.setFillColor(255, 222, 120); doc.rect(x + 1, y + 1, cell - 2, cell - 2, "F"); }
          doc.setTextColor(answers && !inWord.has(i) ? 185 : 25);
          doc.text(p.grid[i].toUpperCase(), x + cell / 2, y + cell * 0.68, { align: "center" });
        }
        doc.setDrawColor(60); doc.setLineWidth(1.2); doc.rect(x0, y0, cell * n, cell * n);
        const top = y0 + cell * n + 28, cols = n <= 10 ? 2 : 3, colW = (W - 2 * M) / cols, per = Math.ceil(p.words.length / cols);
        doc.setFont("helvetica", "normal"); doc.setFontSize(n <= 10 ? 14 : 11); doc.setTextColor(25);
        p.words.forEach((w, k) => doc.text(w.w, M + Math.floor(k / per) * colW, top + (k % per) * (n <= 10 ? 20 : 15)));
      };
      head(p.theme, `Word search · ${p.levelName} · find ${p.words.length} words`);
      grid(false);
      doc.addPage();
      head(`${p.theme}: answer key`, "Every word, highlighted");
      grid(true);
    } else {
      const cell = 44, x0 = (W - cell * 9) / 2, y0 = M + 60;
      const sol = SD.countSolutions(p.givens).solution;
      const grid = answers => {
        doc.setFontSize(22);
        for (let i = 0; i < 81; i++) {
          const r = Math.floor(i / 9), c = i % 9, given = p.givens[i] !== "0";
          if (!given && !answers) continue;
          doc.setFont("helvetica", given ? "bold" : "normal"); doc.setTextColor(given ? 20 : 110);
          doc.text(answers ? sol[i] : p.givens[i], x0 + c * cell + cell / 2, y0 + r * cell + cell * 0.66, { align: "center" });
        }
        for (let k = 0; k <= 9; k++) {
          doc.setDrawColor(40); doc.setLineWidth(k % 3 === 0 ? 2 : 0.5);
          doc.line(x0, y0 + k * cell, x0 + 9 * cell, y0 + k * cell);
          doc.line(x0 + k * cell, y0, x0 + k * cell, y0 + 9 * cell);
        }
      };
      head(`Sudoku: ${p.levelName}`, "Fill every row, column and 3×3 box with the digits 1 to 9");
      grid(false);
      doc.addPage();
      head(`Sudoku: ${p.levelName}, answer key`, "Given digits in bold");
      grid(true);
    }
    doc.save(`letterpile-${p.kind === "wordsearch" ? p.theme.toLowerCase().replace(/[^a-z]+/g, "-") + "-word-search" : "sudoku-" + p.levelName.toLowerCase()}.pdf`);
  }
  const LEVEL_NAMES = { kids: "Kids", teens: "Teens", adults: "Adults", easy: "Easy", medium: "Medium", hard: "Hard" };

  document.querySelectorAll("[data-puzzle]").forEach(box => {
    const p = JSON.parse(box.dataset.puzzle);
    box.querySelector("[data-download]")?.addEventListener("click", e => {
      e.target.disabled = true;
      pdf({ kind: "wordsearch", ...p, levelName: LEVEL_NAMES[p.level] }).catch(err => alert(err.message)).finally(() => { e.target.disabled = false; });
    });
  });

  const form = $("#pzForm");
  if (!form) return;
  let data = null, current = null;
  const out = $("#pzPreview"), status = t => { $("#pzStatus").textContent = t; };
  const kind = () => form.querySelector('[name="kind"]:checked').value;
  const sync = () => { const ws = kind() === "wordsearch"; $("#pzWs").hidden = !ws; $("#pzSd").hidden = ws; };
  form.addEventListener("change", sync);
  const themes = () => data ? Promise.resolve(data) : fetch(root.dataset.themes).then(r => r.json()).then(d => {
    data = { blocked: d.blocked, themes: d.themes.map(t => ({ name: t.name, words: t.words.map(([display, letters]) => ({ display, letters })) })) };
    return data;
  });
  async function make() {
    $("#pzDownload").disabled = true;
    out.innerHTML = "";
    if (kind() === "wordsearch") {
      status("Making your word search…");
      const d = await themes();
      const theme = d.themes.find(t => t.name === $("#pzTheme").value) || d.themes[0];
      const level = $("#pzLevel").value;
      const p = WS.printable(Math.random, theme, level, d.blocked);
      if (!p) { status("Couldn't fit those words; press Make puzzle again."); return; }
      current = { kind: "wordsearch", ...p, levelName: LEVEL_NAMES[level] };
      out.innerHTML = wsHtml(p);
      status(`${theme.name}: ${p.words.length} words in a ${p.size} × ${p.size} grid, each appearing exactly once.`);
    } else {
      const level = $("#pzDifficulty").value, t = SD.LEVELS[level];
      status("Making your sudoku… (hard ones can take a few seconds)");
      let a = null;
      for (let n = 0; !a && n < 5000; n++) { a = SD.attempt(Math.random, t); if (n % 10 === 9) await new Promise(r => setTimeout(r)); }
      if (!a || SD.countSolutions(a.puzzle).count !== 1) { status("Couldn't make one this time; press Make puzzle again."); return; }
      current = { kind: "sudoku", givens: a.puzzle, levelName: LEVEL_NAMES[level] };
      out.innerHTML = sdHtml(current);
      status(`${t.difficulty} sudoku with ${a.clues} clues and exactly one solution.`);
    }
    $("#pzDownload").disabled = false;
  }
  form.addEventListener("submit", e => { e.preventDefault(); make().catch(err => status(err.message)); });
  $("#pzDownload").addEventListener("click", () => {
    if (!current) return;
    $("#pzDownload").disabled = true;
    status("Building the PDF…");
    pdf(current).then(() => status("PDF ready: puzzle on page 1, answer key on page 2.")).catch(err => status(err.message)).finally(() => { $("#pzDownload").disabled = false; });
  });
  sync();
  make().catch(err => status(err.message));
})();
