# Overview tab

> **Status:** stub · **Owner:** #1483 · **Route:** `/staff/statistics` · Back to the
> [hub](../access-statistics.md)

## Purpose

The landing tab: KPI tiles for the selected range (visits, unique visitors, logged-in users,
average visit duration, new vs returning). Each tile links to its tab.

## Decided

- Overview is the **landing** tab of the statistics page.
- KPI tiles are plain Bootstrap cards and don't need Recharts (see
  [shared infrastructure](shared-infrastructure.md)).
- Implemented **last**, since it reuses the other tabs' aggregations.

## Metrics

_To define (#1483):_ the KPI tiles and their exact definitions for the selected range
(visits, unique visitors, logged-in users, average visit duration, new vs returning), in
terms of `Visit` and the visitor key (see [data model](data-model.md)).

## Filters

_To define (#1483):_ which shared filters apply, and any tab-specific behavior (see
[shared infrastructure](shared-infrastructure.md)).

## Chart and layout

_To define (#1483):_ the tile layout, and the link from each tile to its tab.

## API

_To define (#1483):_ the endpoint: a dedicated summary endpoint, or one reusing the other
tabs' aggregations.

## Edge cases

_To define (#1483):_ tab-specific cases.

## Open questions

- Whether to show a comparison with the previous period.

## Implementation sub-issues

_Created by #1483._
