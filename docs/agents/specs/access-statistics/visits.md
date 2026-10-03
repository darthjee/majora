# Visits tab

> **Status:** stub · **Owner:** #1484 · **Route:** `/staff/statistics/visits` · Back to the
> [hub](../access-statistics.md)

## Purpose

Visits-over-time chart, split into anonymous and logged-in.

## Decided

- Replaces the original "sessions graph": the chart counts **visits**, not sessions (see
  [data model](data-model.md)).
- Split into anonymous and logged-in.
- Implemented **first** among the tabs, since it proves the end-to-end pipeline.

## Metrics

_To define (#1484):_ exactly what is counted: visits **started** in each bucket (see
[data model](data-model.md)).

## Filters

_To define (#1484):_ which shared filters apply, and any tab-specific behavior (see
[shared infrastructure](shared-infrastructure.md)).

## Chart and layout

_To define (#1484):_ the anonymous vs logged-in split and the chart type (stacked bars or
lines); tooltip contents.

## API

_To define (#1484):_ the endpoint response shape.

## Edge cases

_To define (#1484):_ tab-specific cases.

## Open questions

- None beyond the "To define" items above.

## Implementation sub-issues

_Created by #1484._
