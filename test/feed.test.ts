import assert from "node:assert/strict";
import test from "node:test";
import { Planner, applyFeed } from "../src/index.ts";

const bounds = {start: 0, end: 100};

test("last update wins for each resource", () => {
  const p = new Planner();
  const result = applyFeed(p, [
    {resource: "a", entries: [bounds]},
    {resource: "b", entries: [{start: 1, end: 3}, {start: 3, end: 6}]},
    {resource: "a", entries: []},
  ]);
  assert.deepEqual(result, {updates: 3, resources: 2, windows: 1});
  assert.deepEqual(p.blocked("a", bounds), []);
  assert.deepEqual(p.blocked("b", bounds), [{start: 1, end: 6}]);
});

test("accepts one-pass feeds", () => {
  function* records() {
    yield { resource: "r", entries: [bounds] };
  }
  const p = new Planner();
  applyFeed(p, records());
  assert.deepEqual(p.blocked("r", bounds), [bounds]);
});

test("invalid calendar is rejected", () => {
  const p = new Planner();
  p.replace("a", [bounds]);
  assert.throws(() => applyFeed(p, [{resource: "a", entries: [{start: 7, end: 5}]}]));
  assert.deepEqual(p.blocked("a", bounds), [bounds]);
});
