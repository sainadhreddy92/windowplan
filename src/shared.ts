import { duration, interval, overlap } from "./interval.ts";
import type { Interval } from "./interval.ts";
import type { Planner } from "./planner.ts";

function intersect(left: Interval[], right: Interval[]): Interval[] {
  const result: Interval[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    const a = left[i];
    const b = right[j];
    const common = overlap(a, b);
    if (common) result.push(common);
    if (a.end <= b.end) i++;
    if (b.end <= a.end) j++;
  }
  return result;
}

/** Find one uninterrupted slot available across every requested resource. */
export function sharedSlot(
  planner: Planner,
  resources: Iterable<string>,
  horizon: Interval,
  length: number,
): Interval | undefined {
  if (resources == null || typeof resources === "string" || resources instanceof String) {
    throw new TypeError("resources must be an iterable of resource IDs, not a single string");
  }
  duration(length);
  let candidates = [interval(horizon)];
  const ids = new Set(resources);
  if (ids.size === 0) throw new RangeError("at least one resource is required");
  for (const id of ids) {
    candidates = intersect(candidates, planner.available(id, horizon));
  }
  const first = candidates.find(span => span.end - span.start >= length);
  return first && { start: first.start, end: first.start + length };
}
