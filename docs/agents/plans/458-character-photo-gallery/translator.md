# Translator Plan: Character photo gallery

Main plan: [plan.md](plan.md)

## Shared contracts

Frontend will call:
- `Translator.t('character_page.photos_title')` — section heading.
- `Translator.t('character_photos_preview.empty')` — empty-state text.

A missing key falls back to the key itself, so frontend's work is not blocked on this, but both
keys must exist in every locale file before this issue is considered done.

## Implementation Steps

### Step 1 — Add the new keys to every locale file

In `frontend/assets/i18n/en.yaml`:
- Add `photos_title: Photos` under the existing `character_page:` namespace (alongside
  `treasures_title: Treasures`, `frontend/assets/i18n/en.yaml:75-83`).
- Add a new `character_photos_preview:` namespace with `empty: No photos yet.`, mirroring the
  existing `character_treasures_preview: { empty: No treasures yet. }` block
  (`frontend/assets/i18n/en.yaml:102-103`).

Repeat the same two additions (translated appropriately) in `frontend/assets/i18n/pt.yaml`,
keeping the exact same key structure and nesting as `en.yaml`.

### Step 2 — Verify key parity

Run the i18n sync check and fix any reported drift:

```bash
docker-compose run --rm majora_fe yarn check_i18n
```

## Files to Change

- `frontend/assets/i18n/en.yaml` — add `character_page.photos_title` and
  `character_photos_preview.empty`.
- `frontend/assets/i18n/pt.yaml` — add the same two keys, translated.

## CI Checks

- `frontend`: `docker-compose run --rm majora_fe yarn check_i18n` (CI job: `frontend-checks`)

## Notes

- No new language is being added, so `Translator.js`/`LanguageSelectorController.js` registration
  is out of scope for this issue.
