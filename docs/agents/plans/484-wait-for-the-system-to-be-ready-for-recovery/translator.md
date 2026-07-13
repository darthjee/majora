# Translator Plan: Wait for the system to be ready for recovery

Main plan: [plan.md](plan.md)

## Shared contracts

- Add the key `recover_password_page.waiting_for_server` under the existing
  `recover_password_page:` section in every `frontend/assets/i18n/*.yaml`
  file. The `frontend` agent will render it via
  `Translator.t('recover_password_page.waiting_for_server')` — you own the
  key and its translated text, the frontend agent only consumes it.

## Implementation Steps

### Step 1 — Add the new key to every language file

- In `frontend/assets/i18n/en.yaml`, under the existing `recover_password_page:`
  section (see the `title`/`new_password_label`/etc. keys already there),
  add:
  ```yaml
  waiting_for_server: Waiting for the server to be ready…
  ```
- Add the equivalent key with a natural translation to every other
  `frontend/assets/i18n/*.yaml` file (e.g. `pt.yaml`), keeping key parity
  across all language files.

### Step 2 — Verify key parity

Run the translation key-parity check to confirm no language file is missing
the new key.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `recover_password_page.waiting_for_server`.
- `frontend/assets/i18n/pt.yaml` (and any other language file present) — add the same key, translated.

## CI Checks

- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Coordinate with the `frontend` agent only on the key name — the actual
  rendering call is the frontend agent's responsibility.
