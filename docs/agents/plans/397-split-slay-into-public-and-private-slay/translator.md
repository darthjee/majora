# Translator Plan: Split slain into public and private slain

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend agent's new "public slain" overlay button and confirm modal read these keys:
`slain_confirm_modal.public_slain_title`, `public_revive_title`, `public_slain_body`,
`public_revive_body`, `public_slain_button`, `public_revive_button`.

## Implementation Steps

### Step 1 — Add public-slain keys to both locales

In `frontend/assets/i18n/en.yaml`, add alongside the existing `slain_confirm_modal` keys
(`slain_title`, `revive_title`, `slain_body`, `revive_body` around line 36-40, `slain_button`/
`revive_button` around line 66-67):

```yaml
slain_confirm_modal:
  public_slain_title: Mark as Publicly Slain
  public_revive_title: Publicly Revive Character
  public_slain_body: Are you sure you want to mark this character as publicly slain?
  public_revive_body: Are you sure you want to publicly revive this character?
  ...
  public_slain_button: Mark as Publicly Slain
  public_revive_button: Publicly Revive
```

Add the equivalent Portuguese entries to `frontend/assets/i18n/pt.yaml`, following the exact
same key placement and the file's existing translation style for the current `slain_*`/
`revive_*` entries (mirror their phrasing, don't invent new tone/wording conventions).

### Step 2 — Verify sync

Run the translation-sync check to confirm every new key exists in both locale files with no
mismatches.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add 6 new `slain_confirm_modal.public_*` keys.
- `frontend/assets/i18n/pt.yaml` — add the same 6 keys, translated.

## CI Checks

- `frontend/`: `docker-compose run --rm majora_fe npm run check_i18n` (CI job: `frontend-checks`)

## Notes

- Coordinate key names with the frontend agent's `SlainConfirmModalHelper.jsx` changes — the
  frontend plan expects exactly these key names (`public_slain_title`, `public_revive_title`,
  `public_slain_body`, `public_revive_body`, `public_slain_button`, `public_revive_button`).
