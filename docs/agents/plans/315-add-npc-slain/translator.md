# Translator Plan: Add NPC slain

Main plan: [plan.md](plan.md)

## Shared contracts

The `frontend` agent will call `Translator.t('<key>')` for every new
user-visible string introduced by this issue and will not hardcode English
text. The existing `photo_upload_modal.title` key ("Upload Photo") is reused
unchanged for the overlay upload button — no new key needed for it. Add the
keys below to every existing locale file under `frontend/assets/i18n/`
(currently `en.yaml` and `pt.yaml`; keep all locale files in sync, per the
key-parity check run by `npm run check_i18n`).

Note: `Translator.t()` does not support string interpolation (plain
dot-path lookup only, see `frontend/assets/js/i18n/Translator.js`) — keep
all copy below generic (no character name placeholders), matching the
issue's request for a "generic confirm/cancel" modal.

## Implementation Steps

### Step 1 — Slain/Revive overlay button label

Add to the existing `character_page` namespace (near `character_page.edit`),
since the button appears both on the NPC show page and the NPC index cards
and both call sites can share one pair of labels:

```yaml
character_page:
  slain_button: Mark as Slain
  revive_button: Revive
```

### Step 2 — Confirmation modal namespace

Add a new namespace, following the `photo_upload_modal` shape:

```yaml
slain_confirm_modal:
  slain_title: Mark as Slain
  revive_title: Revive Character
  slain_body: Are you sure you want to mark this character as slain?
  revive_body: Are you sure you want to revive this character?
  confirm: Confirm
  cancel: Cancel
```

Coordinate with the `frontend` agent on the exact key names it ends up
referencing in `SlainConfirmModalHelper.jsx` — if it picks different names
during implementation, keep this file's keys in lockstep rather than adding
a duplicate set.

### Step 3 — Verify key parity

Run the key-parity check across every locale file after adding the keys.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add the keys above
- `frontend/assets/i18n/pt.yaml` — add the equivalent Portuguese keys (and
  any other locale file present at implementation time)

## CI Checks

- `frontend/`: `docker-compose run --rm frontend npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- This file's key names are a starting proposal — the `frontend` agent's
  actual `Translator.t()` calls are the source of truth; update this list if
  it diverges during implementation.
