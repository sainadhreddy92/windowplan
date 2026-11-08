import assert from "node:assert/strict";
import test from "node:test";
import { occurrences, Planner } from "../src/index.ts";

test("materializes only occurrences before count and horizon end", () => {
  const schedule = { first: 3, period: 10, length: 4, count: 3 };
  assert.deepEqual(occurrences(schedule, {start: 0, end: 25}), [
    {start: 3, end: 7}, {start: 13, end: 17}, {start: 23, end: 25},
  ]);
  assert.deepEqual(occurrences(schedule, {start: 33, end: 90}), []);
});

test("places a job around an unbounded recurring schedule", () => {
  const p = new Planner();
  const horizon = {start: 40, end: 65};
  p.replace("r", occurrences({first: 0, period: 10, length: 4}, horizon));
  assert.deepEqual(p.firstSlot("r", horizon, 5), {start: 44, end: 49});
});

test("rejects overlapping recurrence definitions", () => {
  assert.throws(() => occurrences({first: 0, period: 3, length: 4}, {start: 0, end: 10}));
});
