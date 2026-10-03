# Duration tab

> **Status:** stub · **Owner:** #1486 · **Route:** `/staff/statistics/duration` · Back to
> the [hub](../access-statistics.md)

## Purpose

Average and median visit duration over time, hits per visit, and a histogram of visit
durations.

## Decided

- Replaces the original "average times" boundary item: in scope, backed by `Visit`
  tracking (#1478). Visit duration is `last_seen_at - started_at` (see
  [data model](data-model.md)).
- The median is computed in Python by the shared aggregator, since MySQL has no `MEDIAN`
  (see [shared infrastructure](shared-infrastructure.md)).

## Metrics

_To define (#1486):_ average and **median** visit duration over time; hits per visit (see
[data model](data-model.md)).

## Filters

_To define (#1486):_ which shared filters apply, and any tab-specific behavior (see
[shared infrastructure](shared-infrastructure.md)).

## Chart and layout

_To define (#1486):_ the chart types; the **histogram** of durations and its bin edges.

## API

_To define (#1486):_ the endpoint response shape.

## Edge cases

_To define (#1486):_ how single-hit visits (duration 0) are treated; the effect of the #1478
write throttle on precision.

## Open questions

- None beyond the "To define" items above.

## Implementation sub-issues

_Created by #1486._
