# Translator Plan: Add option type to Game Poll

Main plan: [plan.md](plan.md)

## Shared contracts

Frontend (see [frontend.md](frontend.md)) reads three new keys under `game_poll_new_page` via
`Translator.t(...)`:

- `option_type_label` — label for the new select on the New Poll form.
- `option_type_text` — option/label text for the `text` option type.
- `option_type_date` — option/label text for the `date` option type.

## Implementation Steps

### Step 1 — Add the new keys

Add the three keys to `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`, under
the existing `game_poll_new_page:` block, next to the current `type_label`/`type_single`/
`type_multiple` entries (same naming pattern, applied to the new `option_type` field instead of
the existing `type` field):

```yaml
game_poll_new_page:
  # ...existing keys...
  option_type_label: Option type      # en
  option_type_text: Text
  option_type_date: Date
```

Use accurate Portuguese translations for `pt.yaml` (not literal placeholders).

### Step 2 — Verify key sync

Run this project's translation-key-sync verification script (see `AGENTS.md/docs/agents/` for
its exact location and invocation) to confirm `en.yaml` and `pt.yaml` stay in sync after the
addition.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `option_type_label`, `option_type_text`, `option_type_date`.
- `frontend/assets/i18n/pt.yaml` — add the same three keys, translated.

## Notes

- Keep the keys inside the existing `game_poll_new_page:` block — no new top-level section is
  needed, and the Poll detail page (`GamePollHelper.jsx`) reuses these same keys rather than
  duplicating them under `game_poll_page:`.
