# Plan: Add common special items

Issue: [826-add-common-special-items.md](../../issues/826-add-common-special-items.md)

## Overview

Add a new, fully additive `GameCommonItem` entity: a game-only (no character-owned copies)
priced catalog of common items (potions, drugs, ammunition, etc.), shaped after the existing
`GamePossession` feature (single photo, `hidden` flag, dm/admin + staff/player permissions) with
two extra fields (`price`, `category`) borrowed in convention from `Treasure.value` and
`Game.GAME_TYPE_CHOICES` respectively. `GameItem`/`CharacterItem` are not touched.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)
- [cache](cache.md)

## Shared contracts

### New model shape (backend produces; frontend/cache consume via the API surface below)

`GameCommonItem` (`backend/games/models/game/game_common_item.py`), mirroring `GamePossession`:
- `game` — FK `Game`, `related_name='common_items'`
- `name` — `CharField(max_length=200)`
- `price` — `IntegerField()` (same convention as `Treasure.value`: implicit single currency, no
  currency/unit field; displayed via the existing `TreasureMoney`/`TreasureMoneyHelper` +
  `MoneyModelRegistry`)
- `description` — `TextField(blank=True, default='')`
- `photo` — FK `GameCommonItemPhoto` (new model, subclasses `BasePhoto` like
  `GamePossessionPhoto`), `SET_NULL`, `null=True, blank=True`, `related_name='+'`
- `hidden` — `BooleanField(default=False)`
- `category` — `CharField` with class-constants-+-`CHOICES` convention (mirroring
  `Game.GAME_TYPE_CHOICES`): `CATEGORY_POTION='potion'`, `CATEGORY_DRUG='drug'`,
  `CATEGORY_CONSUMABLE='consumable'`, `CATEGORY_AMMUNITION='ammunition'`,
  `CATEGORY_POISON='poison'`, `CATEGORY_GEAR='gear'`, `CATEGORY_OTHER='other'` (default). Same
  choice list applies regardless of the owning game's `game_type`.
- `history` — `HistoricalRecords(app='versioning', user_db_constraint=False)`

### API surface (backend produces; frontend/cache consume)

New routes in `backend/games/urls/games.py`, mirroring the `possessions` block exactly:
- `GET/POST games/<slug:game_slug>/common_items.json` — list non-hidden (public) / create
  (`staff`+`player`, dm/admin shortcut)
- `GET games/<slug:game_slug>/common_items/all.json` — list all incl. hidden, DM/staff-only,
  `X-Skip-Cache: true`
- `GET/PATCH games/<slug:game_slug>/common_items/<int:common_item_id>.json` — detail (public,
  404s on hidden for non-privileged) / edit (`staff`+`player`)
- `GET games/<slug:game_slug>/common_items/<int:common_item_id>/full.json` — detail incl.
  hidden, DM/staff-only, `X-Skip-Cache: true`
- `POST games/<slug:game_slug>/common_items/<int:common_item_id>/photo_upload.json` — photo
  upload init (`staff`+`player`)
- `GET permissions/game_common_item.json` — entity-agnostic role-simulated `can_edit` (mirrors
  `permissions/game_possession.json`)

Serializer field names (`backend/games/serializers/games/common_items/`):
- List: `id`, `name`, `photo_path`, `price`, `category` (price/category surface at list level,
  unlike `description`, since the whole point is browsing prices without opening each item)
- All-list (+hidden): adds `hidden`
- Detail (extends list): adds `description`
- Full-detail (+hidden, extends detail): adds `hidden`
- Update payload: `name`, `description`, `price`, `category`, `hidden` (all `required=False`)
- Create payload: `name` (required), `price` (required), `description`/`category`/`hidden`
  (optional, defaulting to `''`/`GameCommonItem.CATEGORY_OTHER`/`False`)

Permissions config (`backend/permissions/config/game_common_item/endpoints.yml`): `create`,
`photo_upload`, `edit` → `staff` + `player`.

### Frontend surface (frontend produces; translator consumes)

Route names registered in `HashRouteResolver.js` (paths under `/games/:game_slug/common_items`)
and `AppHelper.jsx`'s page map: `gameCommonItems`, `gameCommonItem`, `gameCommonItemNew`,
`gameCommonItemEdit`.

i18n namespaces needed (mirroring `game_possessions_page`/`possession_page`/
`possession_edit_page`/`possession_new_page`): `game_common_items_page`, `common_item_page`,
`common_item_edit_page`, `common_item_new_page` — plus one label key per `category` value
(`potion`, `drug`, `consumable`, `ammunition`, `poison`, `gear`, `other`) under
`common_item_page.category.*` (or equivalent), used by both the show page and any list/filter UI.
Price display reuses the existing `TreasureMoney` component/keys — no new price-formatting keys
needed.

### Cache surface (backend's API surface above, consumed by cache)

`navi/navi_config.yaml`/`navi/resources/*.yml` need entries for the new public endpoints
(`common_items.json` collection, `common_items/<id>.json` detail) following whatever pattern
`possessions`/`items` already use there; the `_all`/`full` DM-only variants must NOT be warmed
and must be confirmed (read-only check, per the cache agent's own remit) to already set
`X-Skip-Cache: true` as backend implements them.
