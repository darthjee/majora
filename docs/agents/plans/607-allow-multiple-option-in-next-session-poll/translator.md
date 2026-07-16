# Translator Plan: Allow multiple option in next session poll

Main plan: [plan.md](plan.md)

## Shared contracts

- [frontend](frontend.md) will reference three new keys under the `session_poll_modal` namespace: `type_label`, `type_single`, `type_multiple`, via `Translator.t('session_poll_modal.type_label')` etc. These must exist, with identical keys, in every locale file before the frontend change ships.

## Implementation Steps

### Step 1 — Add the new keys to every locale file

In `frontend/assets/i18n/en.yaml`, under the existing `session_poll_modal:` namespace (currently `title`, `dates_label`, `confirm`, `cancel`, `error`), add:

```yaml
  type_label: Type
  type_single: Single choice
  type_multiple: Multiple choice
```

(reuse the exact wording already used for `game_poll_new_page.type_label` / `type_single` / `type_multiple`, for consistency).

Add the equivalent translated keys to `frontend/assets/i18n/pt.yaml` under its own `session_poll_modal:` namespace, matching that file's existing translation style for the same generic-poll-form keys.

### Step 2 — Verify sync

Run the key-sync check and fix any reported mismatch:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `type_label`, `type_single`, `type_multiple` under `session_poll_modal`.
- `frontend/assets/i18n/pt.yaml` — add the same three keys, translated, under `session_poll_modal`.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- Do not touch any `.jsx`/`.js` component or spec files — rendering the new radio selector is [frontend](frontend.md)'s responsibility.
