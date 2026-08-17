# Translator Plan: Add common special items

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the exact page/field/category vocabulary [frontend](frontend.md) wires into the new
`common_item`/`GameCommonItem` pages — coordinate on final key names with frontend before/while
it lands, so the yaml files and the component `Translator.t(...)` calls match on the first pass.
Adds four new i18n namespaces plus category labels, mirroring the existing `possession_*`
namespace family (`possession_page`, `game_possessions_page`, `possession_new_page`,
`possession_edit_page`).

## Implementation Steps

### Step 1 — New namespaces, mirroring the `possession_*` family exactly

For both `frontend/assets/i18n/en/` and `frontend/assets/i18n/pt/`:
- `game_common_items_page.yaml` — mirrors `game_possessions_page.yaml`: `loading`, `title`,
  `hidden_label`, `create_common_item` (or whatever the actual "Create X" key frontend uses).
- `common_item_page.yaml` — mirrors `possession_page.yaml`: `loading`, `hidden_label`.
- `common_item_new_page.yaml` — mirrors `possession_new_page.yaml`: `title`, `name_label`,
  `description_label`, `price_label`, `category_label`, `hidden_label`, `submit`, `error`,
  `photo_upload_failed`, `retry_photo_upload`, `skip_photo_upload`.
- `common_item_edit_page.yaml` — mirrors `possession_edit_page.yaml` (same key shape as `_new_
  page` adjusted for edit copy).

### Step 2 — Category labels

Add one label per `GameCommonItem.category` value under whichever namespace/key path
[frontend](frontend.md) actually reads from (likely `common_item_page.category.*`, used by both
the show-page field and the new/edit-page `<select>`): `potion`, `drug`, `consumable`,
`ammunition`, `poison`, `gear`, `other`. This is a new pattern in this codebase — no existing
`CHOICES`-backed field (e.g. `Game.GAME_TYPE_CHOICES`) has i18n labels for its values today — so
double check with frontend exactly where the component expects to find these keys.

### Step 3 — Verify

Run the translation-key sync check locally (see CI Checks below) to confirm `en`/`pt` stay in
lockstep — every key added to `en` must have a matching `pt` key (a placeholder/literal
translation is fine if a proper Portuguese translation isn't available yet, as long as the check
passes).

## Files to Change

- `frontend/assets/i18n/en/game_common_items_page.yaml` (+ `pt/`)
- `frontend/assets/i18n/en/common_item_page.yaml` (+ `pt/`)
- `frontend/assets/i18n/en/common_item_new_page.yaml` (+ `pt/`)
- `frontend/assets/i18n/en/common_item_edit_page.yaml` (+ `pt/`)

## CI Checks

- `frontend`: `npm run check_i18n` (CI job `frontend-checks`) — verifies `en`/`pt` translation
  keys stay in sync.

## Notes

- Confirm exact key names with [frontend](frontend.md) before finalizing — this file lists the
  expected shape based on mirroring `possession_*`, but the literal key strings frontend's
  `Translator.t(...)` calls use are the source of truth.
