# Translator Plan: Wait for the system to be ready for recovery

Main plan: [plan.md](plan.md)

## Shared contracts

- Frontend (`RecoverPasswordHelper.jsx`) will call `Translator.t('recover_password_page.waiting_for_server')`
  for the loading message shown while polling `/ready.json`. This key must exist in every
  maintained language file with equivalent meaning ("Checking server status..." /
  "Waiting for the server to be ready..." or similar).

## Implementation Steps

### Step 1 — Add the new key

Add `waiting_for_server` under the existing `recover_password_page:` namespace in
`frontend/assets/i18n/en.yaml` (near `title`/`success`, line ~107):

```yaml
recover_password_page:
  title: Reset password
  waiting_for_server: Checking server status...
  new_password_label: New password
  ...
```

Add the equivalent key with a natural Portuguese translation to
`frontend/assets/i18n/pt.yaml`, in the same namespace/position.

### Step 2 — Verify key sync

Run the key-sync verification script to confirm no locale is missing the new key:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

(wraps `frontend/scripts/check_i18n.js`, which diffs flattened dotted-path keys across all
`frontend/assets/i18n/*.yaml` files against the alphabetically-first file as reference.)

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `recover_password_page.waiting_for_server`.
- `frontend/assets/i18n/pt.yaml` — add the matching Portuguese translation.

## CI Checks

- `frontend/`: `yarn check_i18n` (translation key-sync check; run locally via
  `docker-compose run --rm majora_fe yarn check_i18n`).

## Notes

- Only add the one new key needed for this issue — do not touch unrelated
  `recover_password_page` strings.
