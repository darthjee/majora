# Plan: Access statistics: Visits tab (stacked bar chart)

Issue: [1507-access-statistics-visits-tab-stacked-bar-chart.md](../../issues/1507-access-statistics-visits-tab-stacked-bar-chart.md)

## Overview

Replace the Visits tab placeholder with the real tab: a `visits` quantity type reading
`GET /staff/statistics/visits.json` (merged in #1506), a controller mapping the response to chart
points, pure bucket-label / range formatting helpers, a lazily loaded stacked `VisitsChart`, and the
page wiring (totals line, empty note, loading / error states, resolved granularity in the filter
bar). The spec is `docs/agents/specs/access-statistics/visits.md` ("Filters", "Chart and layout").
The translator adds the `visits.*` strings; the frontend agent builds everything else.

## Agents involved

- [translator](translator.md)
- [frontend](frontend.md)

## Shared contracts

New top-level `visits:` block in the `staff_statistics_page` namespace
(`frontend/assets/i18n/{en,pt}/staff_statistics_page.yaml`), a sibling of the existing `tabs:`
block (do not touch `tabs.visits`). Keys, read by the frontend as
`Translator.t('staff_statistics_page.visits.<key>')`:

| Key | en | pt | Interpolation |
|-----|----|----|---------------|
| `visits.title` | `Visits over time` | `Visitas ao longo do tempo` | — |
| `visits.total` | `Total` | `Total` | — |
| `visits.anonymous` | `Anonymous` | `Anônimos` | — |
| `visits.logged_in` | `Logged-in` | `Logados` | — |
| `visits.logged_in_share` | `Logged-in share` | `Proporção de logados` | — |
| `visits.empty` | `No visits in this range` | `Nenhuma visita neste período` | — |
| `visits.load_error` | `Unable to load visits.` | `Não foi possível carregar as visitas.` | — |

The labels are plain strings; the frontend composes `"<label>: <formatted value>"` itself, so no
interpolation placeholders are needed. `visits.load_error` is an addition to the spec's key list,
so the error state is translated instead of hard-coded (other staff pages hard-code English, e.g.
`'Unable to load users.'`).
