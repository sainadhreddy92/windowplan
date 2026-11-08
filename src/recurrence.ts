import { interval, tick, duration } from "./interval.ts";
import type { Interval } from "./interval.ts";

export interface Schedule {
  readonly first: number;
  readonly period: number;
  readonly length: number;
  readonly count?: number;
}

/** Expand a finite slice of a fixed-period maintenance schedule. */
export function occurrences(schedule: Schedule, horizon: Interval): Interval[] {
  const bounds = interval(horizon);
  const first = tick(schedule.first);
  const period = duration(schedule.period);
  const length = duration(schedule.length);
  if (length > period) throw new RangeError("length exceeds period");
  const count = schedule.count === undefined ? Infinity : tick(schedule.count);
  const initial = Math.max(0, Math.ceil((bounds.start - first) / period));
  const result: Interval[] = [];
  for (let index = initial; index < count; index++) {
    const start = first + index * period;
    if (start >= bounds.end) break;
    result.push({ start: Math.max(bounds.start, start), end: Math.min(bounds.end, start + length) });
  }
  return result;
}
