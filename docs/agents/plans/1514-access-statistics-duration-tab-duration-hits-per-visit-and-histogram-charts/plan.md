# Plan: Access statistics: Duration tab (duration, hits per visit and histogram charts)

Issue: [1514-access-statistics-duration-tab-duration-hits-per-visit-and-histogram-charts.md](../../issues/1514-access-statistics-duration-tab-duration-hits-per-visit-and-histogram-charts.md)

## Overview
Replace the Duration tab placeholder with the real tab. It reads `GET /staff/statistics/duration.json` (already merged in #1513) through a new `duration` quantity type and a `DurationController`. It renders a totals row and three lazy Recharts charts: a duration line chart, a hits per visit line chart and a duration histogram. The layering mirrors the Visitors tab (#1510). The frontend agent owns the code and specs, and the translator agent owns the en/pt strings. Spec: `docs/agents/specs/access-statistics/duration.md`.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

All keys live in `frontend/assets/i18n/{en,pt}/staff_statistics_page.yaml`, under a new `staff_statistics_page.duration` block, a sibling of `visitors` and `overview`. The frontend reads exactly these keys:

| Key | English text |
|-----|--------------|
| `duration.title` | Visit duration over time |
| `duration.visits` | Visits |
| `duration.average_duration` | Average duration |
| `duration.median_duration` | Median duration |
| `duration.average_hits` | Average hits per visit |
| `duration.median_hits` | Median hits per visit |
| `duration.single_hit_share` | Single-hit share |
| `duration.duration_chart` | Visit duration |
| `duration.hits_chart` | Hits per visit |
| `duration.histogram_chart` | Duration distribution |
| `duration.histogram_share` | Share of visits |
| `duration.empty` | No visits in this range |
| `duration.load_error` | Unable to load visit durations. |
| `duration.bins.zero` | 0 s |
| `duration.bins.under_30s` | <30 s |
| `duration.bins.30s_1m` | 30 s–1 m |
| `duration.bins.1m_3m` | 1–3 m |
| `duration.bins.3m_10m` | 3–10 m |
| `duration.bins.10m_30m` | 10–30 m |
| `duration.bins.30m_1h` | 30 m–1 h |
| `duration.bins.over_1h` | ≥1 h |

Notes on the keys:
- Bin keys that start with a digit (`30s_1m`, `1m_3m`, …) must be quoted in YAML if the existing files quote such keys. Either way they must parse as strings.
- The loading state reuses the existing `staff_statistics_page.charts_loading` key.
- The legend and tooltip series names reuse `average_duration`, `median_duration`, `average_hits` and `median_hits`.

Bin `labelKey`, mapped from `histogram[].lower` by the controller: `0 → zero`, `1 → under_30s`, `30 → 30s_1m`, `60 → 1m_3m`, `180 → 3m_10m`, `600 → 10m_30m`, `1800 → 30m_1h`, `3600 → over_1h`.
