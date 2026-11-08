import { interval, normalize, overlap } from "./interval.ts";
import type { Interval } from "./interval.ts";

export function resourceId(value: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError("resource ID must be a nonempty string");
  }
  return value;
}

export class Calendar {
  readonly #entries = new Map<string, Interval[]>();

  replace(resource: string, entries: Iterable<Interval>): void {
    const id = resourceId(resource);
    const normalized = normalize(entries);
    if (normalized.length) this.#entries.set(id, normalized);
    else this.#entries.delete(id);
  }

  blocked(resource: string, horizon: Interval): Interval[] {
    const id = resourceId(resource);
    const bounds = interval(horizon);
    const result: Interval[] = [];
    for (const entry of this.#entries.get(id) ?? []) {
      if (entry.end <= bounds.start) continue;
      if (entry.start >= bounds.end) break;
      const clipped = overlap(entry, bounds);
      if (clipped) result.push(clipped);
    }
    return result;
  }
}
