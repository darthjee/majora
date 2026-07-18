# Translator Plan: Add more link types

Main plan: [plan.md](plan.md)

## Shared contracts

Add these five translation keys under the existing `links_edit_modal:` block in both `frontend/assets/i18n/en.yaml` and `frontend/assets/i18n/pt.yaml`, right after the existing `link_type_lootstudio` key, in this order:

```
link_type_diary
link_type_music
link_type_stl
link_type_background
link_type_reference
```

The frontend reads these via `` Translator.t(`links_edit_modal.link_type_${type}`) ``, where `type` is one of `diary`, `music`, `stl`, `background`, `reference` — the key suffix must match exactly.

## Implementation Steps

### Step 1 — Add English labels

In `frontend/assets/i18n/en.yaml`, under `links_edit_modal:` (around line 287, after `link_type_lootstudio: LootStudio`), add:

```yaml
  link_type_diary: Diary
  link_type_music: Music
  link_type_stl: STL
  link_type_background: Background
  link_type_reference: Reference
```

### Step 2 — Add Portuguese labels

In `frontend/assets/i18n/pt.yaml`, under the equivalent `links_edit_modal:` block (around line 287, after `link_type_lootstudio: LootStudio`), add the matching translations, e.g.:

```yaml
  link_type_diary: Diário
  link_type_music: Música
  link_type_stl: STL
  link_type_background: Cenário
  link_type_reference: Referência
```

Adjust wording if a more natural in-context translation is preferred — these are suggestions, not fixed requirements.

### Step 3 — Verify key sync

Run the project's translation key sync check to confirm `en.yaml` and `pt.yaml` stay aligned (same key set, same nesting) after the additions.

## Files to Change

- `frontend/assets/i18n/en.yaml` — add 5 new `link_type_*` keys.
- `frontend/assets/i18n/pt.yaml` — add 5 new `link_type_*` keys.

## Notes

- Do not touch `link_type_label` or `link_type_none` — those already exist and are unaffected.
- Frontend's dropdown (`LinksEditModalHelper.jsx`) iterates all recognized type values and looks up `link_type_<type>` for each — if a key is missing here, the dropdown will render a raw/fallback translation key instead of a label, so all 5 keys must exist in both locale files before frontend's work is considered complete end-to-end.
