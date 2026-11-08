import assert from "node:assert/strict";
import test from "node:test";
import { Planner } from "../src/index.ts";

const horizon = { start: 10, end: 60 };

test("overlapping and touching windows normalize before clipping", () => {
  const p = new Planner();
  p.replace("a", [{start: 20, end: 30}, {start: 0, end: 20}, {start: 15, end: 25}]);
  assert.deepEqual(p.blocked("a", horizon), [{start: 10, end: 30}]);
  assert.deepEqual(p.available("a", horizon), [{start: 30, end: 60}]);
});

test("returns the first gap long enough for the job", () => {
  const p = new Planner();
  p.replace("a", [{start: 15, end: 30}, {start: 25, end: 40}]);
  assert.deepEqual(p.firstSlot("a", horizon, 12), {start: 40, end: 52});
  assert.equal(p.firstSlot("a", horizon, 21), undefined);
});

test("failed replacement preserves the previous calendar", () => {
  const p = new Planner();
  p.replace("a", [horizon]);
  assert.throws(() => p.replace("a", [{start: 1, end: 2}, {start: 3, end: 2}]));
  assert.deepEqual(p.blocked("a", horizon), [horizon]);
});

test("stored intervals are isolated from caller-owned data", () => {
  const p = new Planner();
  const entry = {start: 12, end: 15};
  p.replace("a", [entry]);
  entry.end = 50;
  assert.deepEqual(p.blocked("a", horizon), [{start: 12, end: 15}]);
});

test("unknown resources are available throughout the horizon", () => {
  assert.deepEqual(new Planner().firstSlot("x", horizon, 50), horizon);
});

test("validates query boundaries and duration", () => {
  const p = new Planner();
  assert.throws(() => p.available("a", {start: 3, end: 3}), RangeError);
  assert.throws(() => p.firstSlot("a", horizon, 0), RangeError);
});
