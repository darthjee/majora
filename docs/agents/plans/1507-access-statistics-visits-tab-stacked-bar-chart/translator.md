# Translator Plan: Access statistics: Visits tab (stacked bar chart)

Main plan: [plan.md](plan.md)

## Shared contracts

Produce the `staff_statistics_page.visits.*` keys exactly as listed in
[plan.md — Shared contracts](plan.md#shared-contracts): `title`, `total`, `anonymous`,
`logged_in`, `logged_in_share`, `empty`, `load_error`, en and pt values as given there.

## Implementation Steps

### Step 1 — Add the `visits.*` strings

Add a top-level `visits:` block under `staff_statistics_page:` in both language files, after the
`filters:` block, with the seven keys and values from the shared contract. Leave the existing
`tabs.visits` untouched. Both files keep the same key set, so `check_i18n` passes.

## Files to Change

- `frontend/assets/i18n/en/staff_statistics_page.yaml` — add the `visits:` block (en values).
- `frontend/assets/i18n/pt/staff_statistics_page.yaml` — add the `visits:` block (pt values).

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)
