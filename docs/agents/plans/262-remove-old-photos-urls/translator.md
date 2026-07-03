# Translator Plan: Remove old photos urls

Main plan: [plan.md](plan.md)

## Shared contracts

Wait for `frontend`'s changes (Steps 2-4 of `frontend.md`) to actually remove the `FormField`s
that reference these keys before deleting them here, so no code briefly references a missing
key. In the same PR this is just an ordering note, not a hard dependency — both diffs land
together.

## Implementation Steps

### Step 1 — Remove the now-unused labels

In `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`, remove:
- `pc_edit_page.avatar_url_label`
- `npc_edit_page.avatar_url_label`
- `game_edit_page.photo_label`
- `game_new_page.photo_label`

Keep every other key in these four namespaces (`title`, `name_label`, `role_label`,
`description_label`, `private_description_label`, `submit`, `error`, `upload_photo_button` for
the character namespaces; `title`, `name_label`, `description_label`, `submit`, `error` for
the game namespaces, plus `upload_photo_button` on `game_edit_page`) untouched.

### Step 2 — Verify key parity

Run the project's translation key-parity check (see `docs/agents/i18n.md` for the exact
command) to confirm `en.yaml` and `pt.yaml` still declare the exact same key set after the
removal.

## Files to Change

- `frontend/assets/i18n/en.yaml` — remove the four keys listed in Step 1.
- `frontend/assets/i18n/pt.yaml` — remove the four keys listed in Step 1.

## CI Checks

- `frontend/`: key-parity check script referenced in `docs/agents/i18n.md` (CI job: frontend
  lint/test job, whichever runs it — confirm in CI config).

## Notes

- Double-check no other namespace happens to reuse these exact key names for an unrelated
  purpose before deleting (unlikely given YAML namespacing, but cheap to confirm).
