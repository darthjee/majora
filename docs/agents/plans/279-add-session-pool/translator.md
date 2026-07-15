# Translator Plan: Add session pool

Main plan: [plan.md](plan.md)

## Shared contracts

Frontend (see [frontend.md](frontend.md)) reads these keys via `Translator.t(...)`:

- `game_session_page.create_pool` — the new "Create Pool" button label.
- `session_poll_modal.title` — modal header.
- `session_poll_modal.dates_label` — label above the dynamic date-options list.
- `session_poll_modal.confirm` — confirm/submit button.
- `session_poll_modal.cancel` — cancel button.
- `session_poll_modal.error` — error message shown when poll creation fails.

## Implementation Steps

### Step 1 — Add the new keys

In `frontend/assets/i18n/en.yaml`:
- Add `create_pool: Create Pool` to the existing `game_session_page:` block.
- Add a new `session_poll_modal:` top-level block (new feature, not an extension of an existing
  page) with `title`, `dates_label`, `confirm`, `cancel`, `error` — wording consistent with the
  existing `game_poll_new_page`/`money_edit_modal` blocks (e.g. `confirm: Create Pool`, mirroring
  `money_edit_modal.confirm`'s pattern of a task-specific confirm label rather than a generic
  "OK").

Mirror both additions in `frontend/assets/i18n/pt.yaml` with accurate Portuguese translations.

### Step 2 — Verify key sync

Run this project's translation-key-sync verification script (see `AGENTS.md`/`docs/agents/` for
its exact location and invocation) to confirm `en.yaml` and `pt.yaml` stay in sync.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `game_session_page.create_pool` and the `session_poll_modal` block.
- `frontend/assets/i18n/pt.yaml` — add the same keys, translated.

## Notes

- Keep `create_pool` inside the existing `game_session_page:` block (it's a session-page action,
  same as `edit`), but give the modal's own strings a dedicated `session_poll_modal:` block
  rather than overloading `game_poll_new_page:` — this modal is a distinct, minimal flow (dates
  only, no title/description fields), not a variant of the full New Poll form.
