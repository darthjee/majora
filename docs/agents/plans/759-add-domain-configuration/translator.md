# Translator Plan: Add domain configuration

Main plan: [plan.md](plan.md)

## Shared contracts

Removes exactly the two i18n keys `frontend` (see its plan) stops consuming: `header.title` and `header.subtitle`. No other key is renamed or touched.

## Implementation Steps

### Step 1 — Remove `header.title`/`header.subtitle`

Remove the `header.title` and `header.subtitle` keys from every `frontend/assets/i18n/*/common.yaml` file (`en`, `pt`, and any others present). These become domain-driven config (`DomainConfiguration.title`/`sub_title`) rather than translated strings — `HeaderHelper.jsx` was their only consumer. Run `npm run check_i18n` locally to confirm the keys are fully gone and nothing else in the translation-sync check still references them.

## Files to Change

- `frontend/assets/i18n/en/common.yaml` — remove `header.title`/`header.subtitle`
- `frontend/assets/i18n/pt/common.yaml` — remove `header.title`/`header.subtitle`

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)
