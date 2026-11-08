import { Calendar } from "./calendar.ts";
import { duration, gaps, interval } from "./interval.ts";
import type { Interval } from "./interval.ts";

export class Planner {
  readonly #calendar = new Calendar();

  replace(resource: string, entries: Iterable<Interval>): void {
    this.#calendar.replace(resource, entries);
  }

  blocked(resource: string, horizon: Interval): Interval[] {
    return this.#calendar.blocked(resource, horizon);
  }

  available(resource: string, horizon: Interval): Interval[] {
    const bounds = interval(horizon);
    return gaps(bounds, this.blocked(resource, bounds));
  }

  firstSlot(resource: string, horizon: Interval, length: number): Interval | undefined {
    duration(length);
    for (const span of this.available(resource, horizon)) {
      if (span.end - span.start >= length) {
        return { start: span.start, end: span.start + length };
      }
    }
    return undefined;
  }
}
