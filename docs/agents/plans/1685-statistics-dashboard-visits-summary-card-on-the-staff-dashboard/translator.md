# Translator Plan: Statistics dashboard: visits summary card on the staff dashboard

Main plan: [plan.md](plan.md)

## Shared contracts

Add exactly the keys listed in the main plan's [Shared contracts](plan.md#shared-contracts):

- ten `staff_dashboard.visits_*` keys in `staff_dashboard.yaml`;
- the new `clear_statistics_confirm_modal` block in `common.yaml`, registered in
  `commonNamespaces` in each language's `index.js`.

## Implementation Steps

### Step 1 — Add the `staff_dashboard` keys

Append the `visits_*` keys to `frontend/assets/i18n/en/staff_dashboard.yaml` with the `en`
values from the contract. Add the same keys with Portuguese translations to
`frontend/assets/i18n/pt/staff_dashboard.yaml`. Keep the `{{visits}}` and `{{sessions}}`
placeholders exactly as written. Quote any value that contains `:` (as `crawler_summary_total`
already is).

### Step 2 — Add the `clear_statistics_confirm_modal` namespace

Add the `clear_statistics_confirm_modal` block to `frontend/assets/i18n/en/common.yaml` and
`frontend/assets/i18n/pt/common.yaml`, right after `clear_crawler_confirm_modal`. Register
`'clear_statistics_confirm_modal'` in `commonNamespaces` in both `en/index.js` and `pt/index.js`,
right after `'clear_crawler_confirm_modal'`. In `pt`, `instruction` must still tell the user to
type the untranslated word `CLEAR` (e.g. `Digite CLEAR para confirmar.`).

## Files to Change

- `frontend/assets/i18n/en/staff_dashboard.yaml` — new `visits_*` keys.
- `frontend/assets/i18n/pt/staff_dashboard.yaml` — new `visits_*` keys, in Portuguese.
- `frontend/assets/i18n/en/common.yaml` — new `clear_statistics_confirm_modal` block.
- `frontend/assets/i18n/pt/common.yaml` — new `clear_statistics_confirm_modal` block, in
  Portuguese.
- `frontend/assets/i18n/en/index.js` and `frontend/assets/i18n/pt/index.js` — register the new
  common namespace.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- If `check_i18n` also checks `index.js` manifests, both languages must list the namespace in
  the same position.
