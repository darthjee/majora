# Issue: Reduce index endpoints responses

## Description
On index/list pages, the frontend renders cards that only need a small subset of fields (name and photo). An investigation of the current serializers showed that Game, Treasure, and Character (PC/NPC) index endpoints are already minimal — they do not include description-type fields. The one real gap is **Items**: `GameItemListSerializer` (game items) and `CharacterItemSerializer` (a PC/NPC's held items) are each reused, unmodified, for both the index/list view and the single-item detail view, so both include `description` even on the index endpoints where it is never rendered.

## Problem
Item index endpoints return the item `description` even though card/preview UI never renders it (confirmed in `ItemPreviewCardHelper.jsx` and `ItemCardHelper.jsx`, which only render name/photo/hidden). This happens because:
- `GameItemListSerializer` is reused as-is by both `game_items` (index) and `game_item_detail` (single-item detail) views.
- `CharacterItemSerializer` is reused as-is by both `character_items` (index) and `character_item_detail` (single-item detail) views.
- The `hidden`-adding `*AllSerializer` variants used for `/items/all.json` and `/items/<id>/all.json` extend these same classes, so they inherit the same index/detail conflation.

## Expected Behavior
- Item index endpoints (`/items.json`, nested PC/NPC `/items.json`) return only `name` and photo (no `description`).
- Item index-all endpoints (`/items/all.json` and nested PC/NPC equivalents) stay lean too: name + photo + `hidden`, no `description`.
- Item detail endpoints (`/items/<id>.json` and nested PC/NPC equivalents) keep returning `description`.
- Item detail-all endpoints (`/items/<id>/all.json` and nested PC/NPC equivalents) keep returning `description` + `hidden`.
- No other resource (Game, Treasure, Character/PC/NPC) needs serializer changes — their index responses are already minimal.

## Solution
Split each of the two conflated serializers into a dedicated index serializer (no `description`) and a dedicated detail serializer (keeps `description`), following the codebase's existing `*ListSerializer`/`*DetailSerializer` naming convention (as already used for `Game`/`Character`) and its existing `HiddenFieldMixin` pattern for the `*All*` variants:

- `GameItemListSerializer` → trimmed to index fields only (drop `description`); add a new `GameItemDetailSerializer` for `game_item_detail`, keeping `description`.
- `GameItemAllListSerializer` (index-all, `/items/all.json`) stays index-shaped (no `description`, adds `hidden`); add a new `GameItemDetailAllSerializer` for `game_item_detail_all` (`description` + `hidden`).
- `CharacterItemSerializer` → trimmed to index fields only (drop `description`); add a new `CharacterItemDetailSerializer` for `character_item_detail`, keeping `description`.
- `CharacterItemAllSerializer` (index-all) stays index-shaped; add a new `CharacterItemDetailAllSerializer` for the per-item detail-all view (`description` + `hidden`).

### Affected pages
- `/#/games/:game_slug/items`
- `/#/games/:game_slug/pcs/:character_id/items` (and its item detail sub-page)
- `/#/games/:game_slug/npcs/:character_id/items` (and its item detail sub-page)

### Affected endpoints (verified against current routes)
- `GET /games/<slug>/items.json` — index, drop `description`
- `GET /games/<slug>/items/all.json` — index-all, drop `description`, keep `hidden`
- `GET /games/<slug>/items/<item_id>.json` — detail, new serializer, keeps `description`
- `GET /games/<slug>/items/<item_id>/all.json` — detail-all, new serializer, keeps `description` + `hidden`
- `GET /games/<slug>/pcs/<character_id>/items.json` — index, drop `description`
- `GET /games/<slug>/pcs/<character_id>/items/all.json` — index-all, drop `description`, keep `hidden`
- `GET /games/<slug>/pcs/<character_id>/items/<item_id>.json` — detail, new serializer
- `GET /games/<slug>/pcs/<character_id>/items/<item_id>/all.json` — detail-all, new serializer
- `GET /games/<slug>/npcs/<character_id>/items.json` — index, drop `description`
- `GET /games/<slug>/npcs/<character_id>/items/all.json` — index-all, drop `description`, keep `hidden`
- `GET /games/<slug>/npcs/<character_id>/items/<item_id>.json` — detail, new serializer
- `GET /games/<slug>/npcs/<character_id>/items/<item_id>/all.json` — detail-all, new serializer

### Out of scope
- Games (`GameListSerializer`/`GameDetailSerializer`), Treasures (no `description` field on the model at all), and Characters/PCs/NPCs (`CharacterListSerializer` already excludes description fields) need no changes.
- The original issue text referenced a `/games/:game_slug/pcs/.../treasures/all.json` route; that route does not exist for PCs (only for NPCs), and is unaffected regardless since Treasure has no description field.

## Benefits
- Smaller item index/index-all responses, with no behavior change for detail views.
- Removes an accidental data leak where full item descriptions were sent to every card render.
- Establishes the same index/detail serializer split already used elsewhere in the codebase (Game, Character) for Items too, closing the last inconsistency.
