# Translator Plan: Access statistics: Visitors tab (new vs returning, anonymous vs logged-in)

Main plan: [plan.md](plan.md)

## Shared contracts

Add the `staff_statistics_page.visitors.*` keys listed in [plan.md](plan.md#shared-contracts), in both languages. The frontend agent relies on these exact key names.

## Implementation Steps

### Step 1 — Add the Visitors tab strings
Add a new `visitors:` map (after `visits:`) to `frontend/assets/i18n/en/staff_statistics_page.yaml` and `frontend/assets/i18n/pt/staff_statistics_page.yaml` with every key of the shared contract. Do not touch `tabs.visitors` or the `overview.*` keys.

## Files to Change
- `frontend/assets/i18n/en/staff_statistics_page.yaml` — new `visitors.*` keys.
- `frontend/assets/i18n/pt/staff_statistics_page.yaml` — same keys, Portuguese.

## CI Checks
- `frontend/`: `docker-compose run --rm majora_fe yarn check_i18n` and `docker-compose run --rm majora_fe yarn lint` (CI job: `frontend-checks`)
