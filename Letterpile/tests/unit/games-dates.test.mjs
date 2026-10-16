// Daily games: the browser picks today's puzzle by the date in UTC, never local time.
// src/assets/games/core.js is loaded as it ships; time zones are tested in child processes.
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { ROOT } from "../helpers.mjs";
import { encode } from "../../scripts/games/util.mjs";

const require = createRequire(import.meta.url);
const CORE = `${ROOT}/src/assets/games/core.js`;
const G = require(CORE);
const at = s => Date.parse(s);

test("today() switches exactly at 00:00 UTC", () => {
  assert.equal(G.today(at("2026-10-16T23:59:59.999Z")), "2026-10-16");
  assert.equal(G.today(at("2026-10-17T00:00:00.000Z")), "2026-10-17");
  assert.equal(G.today(at("2026-12-31T23:59:59.999Z")), "2026-12-31");
  assert.equal(G.today(at("2027-01-01T00:00:00.000Z")), "2027-01-01");
});

test("the countdown reaches zero at 00:00 UTC", () => {
  assert.equal(G.msToMidnight(at("2026-10-16T23:59:59.000Z")), 1000);
  assert.equal(G.msToMidnight(at("2026-10-17T00:00:00.000Z")), 86400000);
  assert.equal(G.clock(G.msToMidnight(at("2026-10-16T21:15:30.000Z"))), "02:44:30");
});

// The same instant gives the same puzzle date in every time zone, including UTC+13 and UTC-10.
for (const tz of ["Pacific/Auckland", "Pacific/Honolulu", "America/Los_Angeles", "UTC"]) {
  test(`same puzzle date in ${tz}`, () => {
    const script = `const G=require(${JSON.stringify(CORE)});console.log(["2026-10-16T10:59:00Z","2026-10-16T23:59:59Z","2026-10-17T00:00:01Z"].map(s=>G.today(Date.parse(s))+"|"+new Date(Date.parse(s)).getDate()).join(","))`;
    const out = execFileSync(process.execPath, ["-e", script], { env: { ...process.env, TZ: tz }, encoding: "utf8" }).trim().split(",");
    assert.deepEqual(out.map(x => x.split("|")[0]), ["2026-10-16", "2026-10-16", "2026-10-17"]);
    // Sanity check that the time zone really was applied: local day-of-month differs from UTC.
    if (tz === "Pacific/Auckland") assert.equal(out[1].split("|")[1], "17"); // 12:59 the next day in NZ (UTC+13)
    if (tz === "Pacific/Honolulu") assert.equal(out[2].split("|")[1], "16"); // 14:00 the day before in Hawaii (UTC-10)
  });
}

test("?date= plays only the previous 7 days; anything else falls back to today", () => {
  const now = at("2026-10-20T08:00:00Z");
  assert.deepEqual(G.pickDate(null, now), { date: "2026-10-20", archive: false });
  assert.deepEqual(G.pickDate("2026-10-19", now), { date: "2026-10-19", archive: true });
  assert.deepEqual(G.pickDate("2026-10-13", now), { date: "2026-10-13", archive: true });
  assert.deepEqual(G.pickDate("2026-10-12", now), { date: "2026-10-20", archive: false }, "8 days back");
  assert.deepEqual(G.pickDate("2026-10-20", now), { date: "2026-10-20", archive: false });
  assert.deepEqual(G.pickDate("2026-10-21", now), { date: "2026-10-20", archive: false }, "no future puzzles");
  assert.deepEqual(G.pickDate("2026-02-30", now), { date: "2026-10-20", archive: false }, "invalid date");
  assert.deepEqual(G.pickDate("../x", now), { date: "2026-10-20", archive: false });
  assert.deepEqual(G.archiveDates(["2026-10-12", "2026-10-13", "2026-10-19", "2026-10-20", "2026-10-21"], now), ["2026-10-19", "2026-10-13"]);
});

test("a device clock more than 5 minutes out is corrected from the server's Date header", () => {
  const device = at("2026-10-17T00:30:00Z"); // device a day ahead of the server
  assert.equal(G.setServerTime("Fri, 16 Oct 2026 00:30:00 GMT", device), -86400000);
  assert.equal(G.setServerTime("Sat, 17 Oct 2026 00:32:00 GMT", device), 0, "2 minutes is left alone");
  assert.equal(G.setServerTime("not a date", device), 0);
  assert.equal(G.setServerTime(null, device), 0);
});

test("answers encoded by the generators decode in the browser code", () => {
  for (const w of ["crane", "about", "zesty"]) assert.equal(G.decode(encode(w, "word:2026-10-16"), "word:2026-10-16"), w);
});
