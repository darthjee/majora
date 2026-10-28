# Plan: Statistics dashboard: visits summary card on the staff dashboard

Issue:
[1685-statistics-dashboard-visits-summary-card-on-the-staff-dashboard.md](../../issues/1685-statistics-dashboard-visits-summary-card-on-the-staff-dashboard.md)

## Overview

Add a `VisitsSummaryCard` to `/#/staff/dashboard`. It shows the unique-visitors count for a
`day` / `week` / `month` period, from `GET staff/statistics/summary.json`. It offers Reload and a
Clear that sits behind a typed `CLEAR` confirmation and calls `DELETE staff/statistics.json`.
The backend endpoints are already merged (#1682, #1684), so this is frontend work plus its
translations. Spec: `docs/agents/specs/statistics_dashboard/dashboard-card.md`.

## Agents involved

- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

The frontend uses these i18n keys and the translator adds them to both `en` and `pt`.
Placeholders are replaced in code with `.replace('{{visits}}', …)`, the same way
`recruit_modal.result_success` is.

**`staff_dashboard` namespace** (`frontend/assets/i18n/<lang>/staff_dashboard.yaml`). Append the
keys to the existing block:

| Key | `en` value |
|---|---|
| `visits_summary_title` | `Unique Visitors` |
| `visits_summary_load_error` | `Unable to load visits summary.` |
| `visits_period_label` | `Period` |
| `visits_period_day` | `Today` |
| `visits_period_week` | `Last 7 days` |
| `visits_period_month` | `Last 30 days` |
| `visits_clear_tooltip` | `Clear statistics` |
| `visits_clear_success` | `Statistics cleared: {{visits}} visits and {{sessions}} sessions deleted.` |
| `visits_clear_error` | `Failed to clear statistics. Please try again.` |
| `visits_statistics_link` | `View full statistics` |

Reload reuses the existing `staff_dashboard.refresh_tooltip` key.

**`clear_statistics_confirm_modal` namespace**, a new block in
`frontend/assets/i18n/<lang>/common.yaml`, next to `clear_cache_confirm_modal`. It must also be
added to `commonNamespaces` in `frontend/assets/i18n/<lang>/index.js`, right after
`'clear_crawler_confirm_modal'`:

| Key | `en` value |
|---|---|
| `title` | `Clear Statistics` |
| `body` | `This deletes every visit and session and resets their IDs. It cannot be undone.` |
| `instruction` | `Type CLEAR to confirm.` |
| `input_label` | `Confirmation` |
| `confirm` | `Clear Statistics` |
| `cancel` | `Cancel` |

The literal word `CLEAR` stays untranslated in every language, including `pt`.
