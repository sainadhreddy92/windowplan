import { resourceId } from "./calendar.ts";
import { normalize } from "./interval.ts";
import type { Interval } from "./interval.ts";
import type { Planner } from "./planner.ts";

export interface CalendarUpdate {
  readonly resource: string;
  readonly entries: Iterable<Interval>;
}

export interface FeedSummary {
  readonly updates: number;
  readonly resources: number;
  readonly windows: number;
}

/** Apply an ordered snapshot feed exported by a maintenance coordinator. */
export function applyFeed(planner: Planner, updates: Iterable<CalendarUpdate>): FeedSummary {
  const latest = new Map<string, number>();
  let count = 0;
  for (const update of updates) {
    const id = resourceId(update.resource);
    const entries = normalize(update.entries);
    planner.replace(id, entries);
    latest.set(id, entries.length);
    count++;
  }
  let windows = 0;
  for (const size of latest.values()) windows += size;
  return { updates: count, resources: latest.size, windows };
}
