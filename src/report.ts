import type { Interval } from "./interval.ts";
import { interval } from "./interval.ts";
import { resourceId } from "./calendar.ts";
import type { Planner } from "./planner.ts";

export interface ResourceReport {
  readonly resource: string;
  readonly blockedTicks: number;
  readonly availableTicks: number;
  readonly longestOpening: Interval | null;
}

/** Produce one row per requested resource, preserving first-seen order. */
export function report(
  planner: Planner,
  resources: Iterable<string>,
  horizon: Interval,
): ResourceReport[] {
  const bounds = interval(horizon);
  const rows: ResourceReport[] = [];
  for (const id of new Set(resources)) {
    const resource = resourceId(id);
    const available = planner.available(resource, bounds);
    let availableTicks = 0;
    let longestLength = 0;
    let longestOpening: Interval | null = null;
    for (const gap of available) {
      const length = gap.end - gap.start;
      availableTicks += length;
      if (length > longestLength) {
        longestLength = length;
        longestOpening = gap;
      }
    }
    rows.push({
      resource, availableTicks, longestOpening,
      blockedTicks: bounds.end - bounds.start - availableTicks,
    });
  }
  return rows;
}
