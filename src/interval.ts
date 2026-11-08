export interface Interval {
  readonly start: number;
  readonly end: number;
}

export function tick(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("expected a nonnegative integer tick");
  }
  return value;
}

export function interval(value: Interval): Interval {
  const start = tick(value.start);
  const end = tick(value.end);
  if (end <= start) throw new RangeError("interval must have positive length");
  return { start, end };
}

export function duration(value: number): number {
  if (tick(value) === 0) throw new RangeError("duration must be positive");
  return value;
}

export function overlap(left: Interval, right: Interval): Interval | undefined {
  const start = Math.max(left.start, right.start);
  const end = Math.min(left.end, right.end);
  return start < end ? { start, end } : undefined;
}

/** Return ordered disjoint intervals with touching spans coalesced. */
export function normalize(entries: Iterable<Interval>): Interval[] {
  const sorted = Array.from(entries, interval);
  sorted.sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: Interval[] = [];
  for (const next of sorted) {
    const last = merged.at(-1);
    if (!last || next.start > last.end) {
      merged.push(next);
    } else if (next.end > last.end) {
      merged[merged.length - 1] = { start: last.start, end: next.end };
    }
  }
  return merged;
}

/** Complement of a normalized, clipped list inside the horizon. */
export function gaps(horizon: Interval, blocked: readonly Interval[]): Interval[] {
  const result: Interval[] = [];
  let cursor = horizon.start;
  for (const span of blocked) {
    if (cursor < span.start) result.push({ start: cursor, end: span.start });
    cursor = span.end;
  }
  if (cursor < horizon.end) result.push({ start: cursor, end: horizon.end });
  return result;
}
