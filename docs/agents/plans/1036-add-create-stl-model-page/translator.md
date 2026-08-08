# Translator Plan: Add create stl_model page

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the exact key list from [plan.md](plan.md)'s "Shared contracts" #4 — [frontend](frontend.md) introduces the `Translator.t('...')` call sites for these keys; this plan adds the actual copy to every locale file so `npm run check_i18n` passes.

## Implementation Steps

### Step 1 — Add the new keys to every locale file

In `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml` (and any other locale file present):

Add one new key to the existing `stl_models_page:` block:
```yaml
stl_models_page:
  loading: Loading STL models...
  new_stl_model: New STL Model
```

Add a new `stl_model_new_page:` block, placed alphabetically/contextually near `stl_model_page:`/`treasure_new_page:` (follow whatever ordering convention the file already uses), mirroring `treasure_new_page:`'s and the NPC/item/document new-page blocks' `photo_upload_failed`/`retry_photo_upload`/`skip_photo_upload` trio verbatim in tone:
```yaml
stl_model_new_page:
  title: New STL Model
  name_label: Name
  tags_label: Tags
  tags_input_placeholder: Type a tag and press Enter, or separate multiple with commas
  add_tag: Add
  submit: Create STL Model
  error: Failed to create STL model. Please try again.
  photo_upload_failed: Failed to upload the photo. The STL model was created — you can retry the upload or skip it for now.
  retry_photo_upload: Retry photo upload
  skip_photo_upload: Skip and continue
```

Match the Portuguese translations' tone/register to the existing `pt.yaml` entries for the equivalent NPC/treasure new-page keys (e.g. reuse `pt.yaml`'s existing `retry_photo_upload`/`skip_photo_upload` copy verbatim where the English source is byte-identical to `game_npc_new_page`'s, since the meaning is the same).

### Step 2 — No changes needed for reused keys

`stl_model_page.tags` (already exists, just moving where it's rendered) and `photo_upload_modal.title` (already generic) need no changes — do not touch them.

### Step 3 — Verify

Run `npm run check_i18n` locally (per `frontend-checks`'s CI job) after adding the keys, to confirm every locale file has the full new key set with no drift.

## Files to Change
- `frontend/assets/i18n/en.yaml` — add `stl_models_page.new_stl_model` + `stl_model_new_page` block.
- `frontend/assets/i18n/pt.yaml` — same, translated.
- Any other locale file present under `frontend/assets/i18n/` at implementation time.

## CI Checks
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`)

## Notes
- Coordinate key names exactly with [frontend](frontend.md) before finalizing copy — if the frontend implementation ends up using slightly different key names (e.g. renames `tags_input_placeholder`), this file's keys must be updated to match, since `check_i18n` only verifies cross-locale consistency, not that frontend code actually calls the keys that exist.
