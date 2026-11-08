import assert from "node:assert/strict";
import test from "node:test";
import { Planner, sharedSlot } from "../src/index.ts";

const bounds = { start: 0, end: 100 };

test("uses the earliest simultaneous opening", () => {
  const p = new Planner();
  p.replace("scanner", [{start: 0, end: 10}, {start: 30, end: 50}]);
  p.replace("writer", [{start: 0, end: 24}, {start: 45, end: 70}]);
  assert.deepEqual(sharedSlot(p, ["scanner", "writer"], bounds, 10), {start: 70, end: 80});
});

test("repeated resource IDs do not change the answer", () => {
  const p = new Planner();
  assert.deepEqual(sharedSlot(p, ["a", "a"], bounds, 3), p.firstSlot("a", bounds, 3));
});

test("returns undefined when availability is disjoint", () => {
  const p = new Planner();
  p.replace("a", [{start: 0, end: 50}]);
  p.replace("b", [{start: 50, end: 100}]);
  assert.equal(sharedSlot(p, ["a", "b"], bounds, 1), undefined);
});
