# CharacterDocument

`CharacterDocument` links a `Character` (PC or NPC) to a `GameDocument`, with its own optional
`name`/`description`/`photo` overrides (each nullable, falling back to the linked
`GameDocument`'s own value when `null` — see "Fallback resolution" below) and its own `hidden`
(`BooleanField`, default `False`, never inherited from `GameDocument.hidden` — see
[GameDocument](game-document.md) above). `unique_together = ('character', 'game_document')` — a
character can hold at most one row per `GameDocument`. Field-for-field a mirror of
[CharacterItem](character-item.md), but scoped down: four dedicated index endpoints (one PC pair,
one NPC pair) expose read access; there is no create endpoint, no detail endpoint, and no photo
upload endpoint for `CharacterDocument` in this issue (all left for follow-up issues), only
Django admin for superusers.

## Document index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/documents.json` | GET | **AllowAny** | Paginated list of `CharacterDocumentSerializer` objects (`id`, `game_document_id`, `name`, `photo_path` — no `description`) for that PC's non-hidden `CharacterDocument` rows |
| `/games/<slug>/pcs/<id>/documents/all.json` | GET | **CharacterEdit** (covers the PC's owning player, that game's GameMaster, or a superuser, via `Character.can_be_edited_by`) | Same lean fields as the plain list, plus a `hidden: boolean` field (via `CharacterDocumentAllSerializer`), and does not exclude hidden held documents. Always sets `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/documents.json` | GET | **AllowAny**, but see the [hidden-NPC gate](character-photo.md#photo-index-endpoints) above | Same shape as the PC list, additionally excluding the NPC's own hidden `CharacterDocument` rows |
| `/games/<slug>/npcs/<id>/documents/all.json` | GET | **GameEdit** | Same lean fields as the plain list, plus `hidden` (same `CharacterDocumentAllSerializer` as the PC variant), and does not exclude hidden held documents. Always sets `X-Skip-Cache: true` |

`description` is intentionally omitted from all four index/index-all endpoints above — there is
no detail endpoint in this issue where it could be exposed instead.

Unknown `game_slug` or `character_id` (or mismatched/wrong type) → 404. All four endpoints order
by `id`.

**Exposed fields** (read): `id` (the `CharacterDocument` row id, not the `GameDocument` id),
`game_document_id`, `name`, `photo_path` — all already fallback-resolved server-side (see below),
so the frontend never needs its own fallback logic. `hidden` is exposed on both `/all.json`
variants only.

## Fallback resolution

`name`, `description`, and `photo_path` are nullable overrides on `CharacterDocument`: a `null`
value falls back to the linked `GameDocument`'s own value, via
`resolve_character_document_field`/`resolve_character_document_photo_path`
(`backend/games/serializers/games/documents/character_document_fields.py`). This is a direct-FK
fallback (`character_document.game_document`), simpler than
[GameTreasure](game-treasure.md)'s context-lookup pattern (which resolves a separate
per-`(game, treasure)` row via the game in serializer context) — no context is needed here.
`hidden` is never part of this fallback; it is a plain field on both models, read independently
on each.

## `hidden`

Governs only whether a `CharacterDocument` row itself is included in the regular
(non-`/all.json`) index endpoints above — it says nothing about the visibility of the
`GameDocument` it links to (see [GameDocument](game-document.md) above for that model's own,
independent `hidden`). A hidden `CharacterDocument` is still fully visible to the character's
owning player (PC) or that game's GameMaster/superuser, via the appropriate `/all.json` endpoint.

Unlike [CharacterTreasure](character-treasure.md)'s NPC-only hidden-held-item filter (`hidden`
there lives on the separate `GameTreasure` catalog row, and a PC keeps seeing every treasure it
owns regardless of catalog visibility), `CharacterDocument.hidden` lives directly on the
character's own row — so **both** the PC and NPC regular list endpoints exclude a character's
own hidden documents; only the two DM/owner-facing `/all.json` variants reveal them.
