# Translator Plan: Access statistics: Domains tab (domain bar chart and table)

Main plan: [plan.md](plan.md)

## Shared contracts

Add a `domains:` section under `staff_statistics_page` with exactly these keys (en + pt):
`title, unknown, domain, group, visits, anonymous, logged_in, logged_in_share, unique_visitors,
average_duration, median_duration, chart, empty, load_error, total, sort_ascending, sort_descending`.

## Implementation Steps

### Step 1 — Add `domains.*` keys

Add the `domains:` section to both language files, following the `visitors:` / `duration:` sections
(e.g. `title: Visits by domain`, `unknown: Unknown`, `chart: Visits per domain`,
`empty: No visits in this period.`, `load_error: Could not load domain statistics.`,
`total: Total`, `logged_in_share: Logged-in share`, `sort_ascending` / `sort_descending` for
screen-reader text on the sort indicator). Portuguese must be translated, not copied.

## Files to Change

- `frontend/assets/i18n/en/staff_statistics_page.yaml` — add `domains:` section
- `frontend/assets/i18n/pt/staff_statistics_page.yaml` — add `domains:` section

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)
