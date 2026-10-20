// Worker thread for crossword.mjs fillGrid(): builds the word indexes once, then fills the
// pattern numbers it is sent and reports each result.
import { parentPort, workerData } from "node:worker_threads";
import { wordData } from "../wordstats.mjs";
import { fillContext, fillPattern } from "./crossword.mjs";

const ctx = fillContext(workerData.date, { words: wordData(), uses: Object.assign(new Map(workerData.uses), { long: new Map(workerData.long) }) });
parentPort.on("message", n => {
  const t0 = Date.now();
  const { grid, note } = fillPattern(ctx, n);
  parentPort.postMessage({ n, grid, note, secs: ((Date.now() - t0) / 1000).toFixed(1) });
});
parentPort.postMessage({ ready: true });
