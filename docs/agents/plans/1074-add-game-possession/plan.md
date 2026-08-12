# Plan: Add Game Possession

Issue: [1074-add-game-possession.md](../issues/1074-add-game-possession.md)

## Overview

Add `GamePossession` — a game-level entity for large, unique belongings (house, boat, tavern) —
by mirroring the existing `GameItem` pattern end to end: model + photo model, serializers,
views, urls, permissions config, request config, list/new/edit/show pages, list-page card
registration, nav entry, i18n, and Navi cache warming. Scope is explicitly narrower than
`GameItem`'s: no PC/NPC ownership/acquisition (tracked separately in #1076), so none of
`GameItem`'s `Character*`/acquire/summary/give-modal machinery is replicated.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [cache](cache.md)
- [translator](translator.md)

## Shared contracts

**Backend → Frontend/Cache — new endpoints** (all under `/games/<slug>/possessions...`,
mirroring `backend/games/urls/games.py`'s `items` block exactly, minus the pc/npc-summary
routes which don't apply since there's no acquisition):

| Method | Path | Purpose |
|---|---|---|
| GET | `/games/<slug>/possessions.json` | paginated, non-hidden list |
| POST | `/games/<slug>/possessions.json` | create |
| GET | `/games/<slug>/possessions/all.json` | paginated, hidden-inclusive list (DM/staff), `X-Skip-Cache` |
| GET | `/games/<slug>/possessions/<id>.json` | non-hidden detail |
| PATCH | `/games/<slug>/possessions/<id>.json` | update |
| GET | `/games/<slug>/possessions/<id>/full.json` | hidden-inclusive detail (DM/staff), `X-Skip-Cache` |
| POST | `/games/<slug>/possessions/<id>/photo_upload.json` | init photo upload (generic `UploadInitiator` flow, same response shape as every other resource's photo-upload-init endpoint) |

**Backend → Frontend — payload shapes** (mirrors `GameItem*Serializer` fields exactly):

- List item (`GamePossessionListSerializer`): `{ id, name, photo_path }`
- List item, hidden-inclusive (`GamePossessionAllListSerializer`): `{ id, name, photo_path, hidden }`
- Detail (`GamePossessionDetailSerializer`): `{ id, name, photo_path, description }`
- Detail, hidden-inclusive (`GamePossessionDetailFullSerializer`): `{ id, name, photo_path, description, hidden }`
- Create payload: `{ name, description?, hidden? }` → `201` with the full-detail shape
- Update payload (PATCH, all optional): `{ name?, description?, hidden? }` → full-detail shape

**Backend → Translator/Frontend — i18n keys** (translator produces these key names; frontend
components consume them verbatim via `Translator.t(...)`):

- `game_possessions_page.{title,loading,hidden_label,create_possession}`
- `possession_new_page.{title,name_label,description_label,hidden_label,submit,error,photo_upload_failed,retry_photo_upload,skip_photo_upload}`
- `possession_edit_page.{title,name_label,description_label,hidden_label,submit,error}`
- `possession_page.{loading,hidden_label}`
- `game_page.possessions` — new key added to the *existing* `game_page.yaml` (nav dropdown entry), alongside its existing `items`/`documents`/`treasures` keys

**Backend → Cache — endpoints to warm** (mirrors `navi/resources/games.yml`'s `game_items`/
`paginated_game_items`/`game_item_detail` block; `/all.json`, `/full.json`, and
`photo_upload.json` are deliberately **not** warmed, same as items/documents):

- `GET /games/{:slug}/possessions.json` (+ its paginated variant)
- `GET /games/{:slug}/possessions/{:id}.json`

## Notes

- No new fields beyond `name`/`description`/`hidden`/photo gallery — confirmed during
  enhancement, no location/value/size attributes needed.
- Uses the older per-model `*Photo`/`BasePhoto` pattern for storage (like `GameItem`), but the
  photo-upload-*init* endpoint still goes through the shared `uploads` app's `UploadInitiator`/
  `PhotoPathBuilder` — same as `GameItem` already does. The issue text's "not the newer generic
  uploads app" refers to model storage, not the upload-init plumbing, which is already shared
  infrastructure all photo-bearing resources use.
- A `default_possession.png` card placeholder image is needed under
  `frontend/assets/images/placeholders/` (mirroring `default_item.png`) for `CardPossessionImage`.
  No source art was supplied with the issue — frontend should flag this rather than invent
  artwork, and may fall back to reusing `default_item.png` temporarily if blocked.
