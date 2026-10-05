# Translator Plan: Access statistics: Visit list tab (paginated visit table)

Main plan: [plan.md](plan.md)

## Shared contracts

Add the 15 `staff_statistics_page.visit_list.*` keys listed in [plan.md](plan.md#shared-contracts),
with the given en / pt values.

## Implementation Steps

### Step 1 — Add `visit_list` translations

Add a `visit_list:` block under `staff_statistics_page` in both locale files, right after the
`users:` block, with the keys and values from the shared contract. The tab label
`tabs.visit_list` already exists; do not touch it.

## Files to Change

- `frontend/assets/i18n/en/staff_statistics_page.yaml` — new `visit_list:` block.
- `frontend/assets/i18n/pt/staff_statistics_page.yaml` — same keys, Portuguese values.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`), run through docker-compose.
