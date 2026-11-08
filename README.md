# Windowplan

Windowplan finds uninterrupted time for jobs that share resources with scheduled maintenance. A caller supplies a search horizon, a job duration, and the resource's maintenance calendar. Windowplan returns the earliest interval where the job fits.

## Quick start

Run directly from a checkout with Node.js 24 or newer. All times and durations use integer ticks in the same unit. For example, a scheduler can use minutes since midnight or epoch milliseconds.

```ts
import { Planner } from "./src/index.ts";

const planner = new Planner();
planner.replace("warehouse", [
  { start: 15, end: 30 },
  { start: 25, end: 40 },
]);

const slot = planner.firstSlot("warehouse", { start: 10, end: 60 }, 12);
console.log(slot); // { start: 40, end: 52 }
```

## Calendar behavior

Intervals include their start and exclude their end. A job can finish when maintenance begins or start when it ends. Maintenance entries may overlap, touch, or arrive out of order. Replacing a resource calendar validates and normalizes the entire input before storing it. Unknown resources have an empty maintenance calendar.

Use `blocked` to inspect merged maintenance intervals within a horizon, `available` for the gaps, and `firstSlot` to place a job. Queries return fresh interval objects. Calling `firstSlot` is a read operation; the caller owns reservations.

## Development

Run `npm test`. The runtime has no external dependencies. Interval operations are in `src/interval.ts`, calendar storage in `src/calendar.ts`, and placement in `src/planner.ts`.
