import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { Planner, sharedSlot } from "../src/index.ts";
import type { Interval } from "../src/index.ts";

const bounds = { start: 0, end: 100 };
const horizon = { start: 10, end: 60 };

/** "warehouse" is blocked 15-40 and "a" is blocked 0-30, so both are free only during 40-60. */
function examplePlanner(): Planner {
  const p = new Planner();
  p.replace("warehouse", [{start: 15, end: 30}, {start: 25, end: 40}]);
  p.replace("a", [{start: 20, end: 30}, {start: 0, end: 20}, {start: 15, end: 25}]);
  return p;
}

describe("sharedSlot", () => {
  describe("no shared slot", () => {
    test("returns undefined when availability is disjoint", () => {
      const p = new Planner();
      p.replace("a", [{start: 0, end: 50}]);
      p.replace("b", [{start: 50, end: 100}]);
      assert.equal(sharedSlot(p, ["a", "b"], bounds, 1), undefined);
    });

    test("returns undefined when the shared gap is one tick too short", () => {
      assert.equal(sharedSlot(examplePlanner(), ["warehouse", "a"], horizon, 21), undefined);
    });

    test("returns undefined when the job is longer than the horizon", () => {
      assert.equal(sharedSlot(new Planner(), ["x"], horizon, 51), undefined);
    });
  });

  describe("shared slot available", () => {
    test("places the job at the start of the shared gap", () => {
      assert.deepEqual(sharedSlot(examplePlanner(), ["warehouse", "a"], horizon, 12), {start: 40, end: 52});
    });

    test("resource order does not change the answer", () => {
      const p = examplePlanner();
      assert.deepEqual(
        sharedSlot(p, ["a", "warehouse"], horizon, 12),
        sharedSlot(p, ["warehouse", "a"], horizon, 12),
      );
    });

    test("repeated resource IDs do not change the answer", () => {
      const p = new Planner();
      assert.deepEqual(sharedSlot(p, ["a", "a"], bounds, 3), p.firstSlot("a", bounds, 3));
    });

    test("accepts a one-pass iterable of resource IDs", () => {
      function* ids() { yield "warehouse"; yield "a"; }
      assert.deepEqual(sharedSlot(examplePlanner(), ids(), horizon, 12), {start: 40, end: 52});
    });
  });

  describe("multiple shared slots", () => {
    test("uses the earliest shared gap that is long enough", () => {
      const p = new Planner();
      p.replace("scanner", [{start: 0, end: 10}, {start: 30, end: 50}]);
      p.replace("writer", [{start: 0, end: 24}, {start: 45, end: 70}]);
      // Shared gaps are 24-30 (6 ticks) and 70-100 (30 ticks).
      assert.deepEqual(sharedSlot(p, ["scanner", "writer"], bounds, 5), {start: 24, end: 29});
      assert.deepEqual(sharedSlot(p, ["scanner", "writer"], bounds, 10), {start: 70, end: 80});
    });
  });

  describe("exact fit", () => {
    test("accepts a job that exactly fills the shared gap at the horizon end", () => {
      assert.deepEqual(sharedSlot(examplePlanner(), ["warehouse", "a"], horizon, 20), {start: 40, end: 60});
    });

    test("accepts a job that exactly fills a gap bounded by two resources", () => {
      const p = new Planner();
      p.replace("m1", [{start: 0, end: 20}]);
      p.replace("m2", [{start: 30, end: 100}]);
      assert.deepEqual(sharedSlot(p, ["m1", "m2"], bounds, 10), {start: 20, end: 30});
    });

    test("accepts a job that exactly fills the whole horizon", () => {
      assert.deepEqual(sharedSlot(new Planner(), ["x", "y"], horizon, 50), {start: 10, end: 60});
    });

    test("accepts an exact fit in an earlier gap before a longer later gap", () => {
      // "warehouse" alone is free 10-15 (5 ticks) and 40-60.
      assert.deepEqual(sharedSlot(examplePlanner(), ["warehouse"], horizon, 5), {start: 10, end: 15});
    });
  });

  describe("free on one resource but not the other", () => {
    test("skips a gap that only one resource has", () => {
      // "warehouse" is free 10-15, but "a" is blocked then.
      assert.deepEqual(sharedSlot(examplePlanner(), ["warehouse", "a"], horizon, 5), {start: 40, end: 45});
    });

    test("returns undefined when the other resource is blocked for the whole horizon", () => {
      const p = examplePlanner();
      p.replace("busy", [horizon]);
      assert.equal(p.firstSlot("warehouse", horizon, 5)?.start, 10);
      assert.equal(sharedSlot(p, ["warehouse", "busy"], horizon, 1), undefined);
    });
  });

  describe("validation", () => {
    test("rejects a bare string instead of splitting it into characters", () => {
      // The letters of "warehouse" include "a", a real resource.
      assert.throws(() => sharedSlot(examplePlanner(), "warehouse", horizon, 12), TypeError);
    });

    test("rejects an empty resource set", () => {
      assert.throws(() => sharedSlot(new Planner(), [], horizon, 12), RangeError);
    });

    test("rejects invalid lengths, horizons, and resource IDs", () => {
      const p = examplePlanner();
      assert.throws(() => sharedSlot(p, ["a"], horizon, 0), RangeError);
      assert.throws(() => sharedSlot(p, ["a"], horizon, 1.5), RangeError);
      assert.throws(() => sharedSlot(p, ["a"], {start: 10, end: 10}, 12), RangeError);
      assert.throws(() => sharedSlot(p, [""], horizon, 12), TypeError);
    });
  });

  describe("integration with Planner", () => {
    test("matches firstSlot for a single resource at every job length", () => {
      const p = examplePlanner();
      for (let length = 1; length <= 51; length++) {
        assert.deepEqual(sharedSlot(p, ["warehouse"], horizon, length), p.firstSlot("warehouse", horizon, length), `length ${length}`);
      }
    });

    test("leaves calendars untouched", () => {
      const p = examplePlanner();
      sharedSlot(p, ["warehouse", "a"], horizon, 12);
      assert.deepEqual(p.blocked("warehouse", horizon), [{start: 15, end: 40}]);
      assert.deepEqual(p.blocked("a", horizon), [{start: 10, end: 30}]);
    });

    test("a booking recorded with replace moves the next shared slot", () => {
      const p = examplePlanner();
      const booked = sharedSlot(p, ["warehouse", "a"], horizon, 12);
      assert.deepEqual(booked, {start: 40, end: 52});
      p.replace("warehouse", [{start: 15, end: 30}, {start: 25, end: 40}, booked!]);
      p.replace("a", [{start: 20, end: 30}, {start: 0, end: 20}, {start: 15, end: 25}, booked!]);
      assert.deepEqual(sharedSlot(p, ["warehouse", "a"], horizon, 8), {start: 52, end: 60});
      assert.equal(sharedSlot(p, ["warehouse", "a"], horizon, 9), undefined);
    });

    test("agrees with a tick-by-tick search on random calendars", () => {
      let seed = 42;
      const rand = (n: number) => (seed = (seed * 1103515245 + 12345) % 2147483648) % n;
      for (let run = 0; run < 2000; run++) {
        const p = new Planner();
        const ids = Array.from({length: 1 + rand(3)}, (_, i) => `r${i}`);
        const calendars = new Map<string, Interval[]>();
        for (const id of ids) {
          const entries = Array.from({length: rand(4)}, () => {
            const start = rand(40);
            return {start, end: start + 1 + rand(10)};
          });
          calendars.set(id, entries);
          p.replace(id, entries);
        }
        const start = rand(30);
        const h = {start, end: start + 1 + rand(30)};
        const length = 1 + rand(15);
        const free = (t: number) => ids.every(id => calendars.get(id)!.every(e => t < e.start || t >= e.end));
        let expected: Interval | undefined;
        for (let s = h.start; s + length <= h.end && !expected; s++) {
          let ok = true;
          for (let t = s; t < s + length && ok; t++) ok = free(t);
          if (ok) expected = {start: s, end: s + length};
        }
        assert.deepEqual(sharedSlot(p, ids, h, length), expected, JSON.stringify({run, calendars: [...calendars], h, length}));
      }
    });
  });
});
