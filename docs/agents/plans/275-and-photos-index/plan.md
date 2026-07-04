# Plan: Add photo index pages for games and characters

Issue: [275-and-photos-index.md](../issues/275-and-photos-index.md)

## Overview

Add three new paginated photo-gallery pages (`/#/games/:game_slug/photos`,
`/#/games/:game_slug/pcs/:id/photos`, `/#/games/:game_slug/npcs/:id/photos`),
each rendering a card grid with a lightbox modal and an upload button reusing
the existing `PhotoUploadModal`. The backend exposes the storage `path` on
photo serializers (currently `fields = ['id']` only) and adds three new
paginated list endpoints following the existing `Paginator`/`game_treasures`
pattern. The frontend adds routes, a `PhotoCard` element, a `PhotoViewModal`
lightbox, three page components, and replaces the currently-broken inline
`CharacterPhotos` gallery on the game/character show pages with a "see all
photos" link. New user-visible strings get translation keys.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### New endpoints (backend produces, frontend consumes)

| Method | URL | Serializer |
|---|---|---|
| GET | `/games/<slug>/photos.json` | `GamePhotoSerializer` (paginated) |
| GET | `/games/<slug>/pcs/<id>/photos.json` | `CharacterPhotoSerializer` (paginated) |
| GET | `/games/<slug>/npcs/<id>/photos.json` | `CharacterPhotoSerializer` (paginated) |

All three follow the existing `Paginator` convention (see
`source/games/paginator.py` and `source/games/views/games/game_treasures.py`):
`page`/`per_page` query params; `page`/`pages`/`per_page`/`total` response
headers; body is a JSON array (no envelope). `AllowAny` read access, same as
`games.json`/`pcs.json`/`npcs.json`/`treasures.json`. Each endpoint only
returns photos where `ready=True` (excludes in-progress/abandoned uploads —
mirrors how `upload_finalize.py` flips `ready` only once the upload
completes; the existing embedded `photos` field on the detail serializers
does **not** filter on `ready`, but the new dedicated list endpoints should,
since they are the primary browsing surface).

### Response item shape (both serializers, after this change)

```json
{ "id": 1, "path": "photos/games/test-game/cover_ab12cd34.jpg" }
```

`path` is the raw storage path (relative), exactly like the existing
`cover_photo_path` / `profile_photo_path` fields already exposed elsewhere
(`GameListSerializer`, `CharacterListSerializer`, `GameDetailSerializer`,
`CharacterDetailSerializer`) — the frontend uses it directly as an `<img src>`
with no prefixing, so no new URL-building convention is introduced.

### Frontend routes (new)

- `#/games/:game_slug/photos` -> page key `gamePhotos`
- `#/games/:game_slug/pcs/:character_id/photos` -> page key `pcCharacterPhotos`
- `#/games/:game_slug/npcs/:character_id/photos` -> page key `npcCharacterPhotos`

Registered in `HashRouteResolver.js` (before the existing, less specific
`:character_id` routes so they don't get swallowed by them — same ordering
concern already respected for `edit` routes) and in `AppHelper.jsx`'s `PAGES`
map.

### Upload path reuse (no change, just confirming the contract)

- Game photos page uploads via `POST /games/<slug>/photo_upload.json`
  (already exists; same path `Game.jsx` already uses for its modal).
- PC/NPC photos pages upload via
  `POST /games/<slug>/pcs/<id>/photo_upload.json` /
  `POST /games/<slug>/npcs/<id>/photo_upload.json` (already exist; same paths
  `PcCharacter.jsx`/`NpcCharacter.jsx` already use).

### Translation keys (translator produces, frontend consumes via `Translator.t()`)

New namespaces `game_photos_page`, `pc_character_photos_page`,
`npc_character_photos_page` (or a shared namespace if the translator agent
judges the three pages' strings to be identical enough to share one — see
`translator.md`), plus a `see_all_photos` key added to the existing
`game_page`/`character_page` namespaces for the new link text. Frontend code
calls `Translator.t('<namespace>.<key>')` exactly as it already does
elsewhere (e.g. `game_treasures_page.treasures`, `game_page.treasures`).
