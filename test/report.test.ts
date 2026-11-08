import assert from "node:assert/strict";
import test from "node:test";
import { Planner, report } from "../src/index.ts";

test("accounts for overlap and picks the earlier of tied openings", () => {
  const p = new Planner();
  p.replace("db", [{start: 3, end: 6}, {start: 5, end: 7}]);
  const [row] = report(p, ["db"], {start: 0, end: 10});
  assert.deepEqual(row, {
    resource: "db", availableTicks: 6, blockedTicks: 4, longestOpening: {start: 0, end: 3},
  });
});

test("deduplicates in caller order and includes unknown resources", () => {
  const p = new Planner();
  p.replace("busy", [{start: 0, end: 100}]);
  const rows = report(p, ["unknown", "busy", "unknown"], {start: 5, end: 15});
  assert.deepEqual(rows.map(r => r.resource), ["unknown", "busy"]);
  assert.equal(rows[0].availableTicks, 10);
  assert.equal(rows[1].longestOpening, null);
});

test("validates the horizon even for an empty report", () => {
  assert.throws(() => report(new Planner(), [], {start: 1, end: 1}), RangeError);
});
