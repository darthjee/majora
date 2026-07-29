# CharacterDocument

`CharacterDocument` links a `Character` (PC or NPC) to a `GameDocument`. It is a thin join —
`name`/`photo_path` are always sourced straight from the linked `GameDocument` (see
[GameDocument](game-document.md) above), with no override/fallback logic left on
`CharacterDocument` itself. `hidden` is a plain `BooleanField` (default `False`), never
inherited from `GameDocument.hidden`. `unique_together = ('character', 'game_document')` — a
character can hold at most one row per `GameDocument`. Four index endpoints (one PC pair, one
NPC pair) and four show/detail endpoints (one PC pair, one NPC pair) expose read access; there
is no create endpoint, no update endpoint, and no photo upload endpoint for `CharacterDocument`
(all left for follow-up issues, if ever needed), only Django admin for superusers.

## Document index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/documents.json` | GET | **AllowAny** | Paginated list of `CharacterDocumentSerializer` objects (`id`, `game_document_id`, `name`, `photo_path`) for that PC's non-hidden `CharacterDocument` rows |
| `/games/<slug>/pcs/<id>/documents/all.json` | GET | **CharacterEdit** (covers the PC's owning player, that game's GameMaster, or a superuser, via `Character.can_be_edited_by`) | Same lean fields as the plain list, plus a `hidden: boolean` field (via `CharacterDocumentAllSerializer`), and does not exclude hidden held documents. Always sets `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/documents.json` | GET | **AllowAny**, but see the [hidden-NPC gate](character-photo.md#photo-index-endpoints) above | Same shape as the PC list, additionally excluding the NPC's own hidden `CharacterDocument` rows |
| `/games/<slug>/npcs/<id>/documents/all.json` | GET | **GameEdit** | Same lean fields as the plain list, plus `hidden` (same `CharacterDocumentAllSerializer` as the PC variant), and does not exclude hidden held documents. Always sets `X-Skip-Cache: true` |

Unknown `game_slug` or `character_id` (or mismatched/wrong type) → 404. All four endpoints order
by `id`.

## Document show/detail endpoints

Mirror `CharacterItem`'s `item_detail`/`item_detail_full` route pair exactly (same `/full.json`
suffix convention, same permission split), narrowed to a single row instead of a paginated list.
No `PATCH` branch exists — there is nothing left on `CharacterDocument` to update.

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/documents/<document_id>.json` | GET | **AllowAny** | A single `CharacterDocumentSerializer` object; 404 if the `CharacterDocument` row is hidden or does not exist (or belongs to a different character/role) |
| `/games/<slug>/npcs/<id>/documents/<document_id>.json` | GET | **AllowAny**, but see the [hidden-NPC gate](character-photo.md#photo-index-endpoints) above | Same as the PC variant; also 404s if the NPC itself is hidden (unless the requester is that game's GameMaster/superuser, in which case `X-Skip-Cache: true` is set) |
| `/games/<slug>/pcs/<id>/documents/<document_id>/full.json` | GET | **CharacterEdit** (PC's owning player, that game's GameMaster, or a superuser) | A single `CharacterDocumentAllSerializer` object (adds `hidden`), including hidden `CharacterDocument` rows. Always sets `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/documents/<document_id>/full.json` | GET | **GameEdit** (no owner concept for NPCs) | Same as the PC `/full.json` variant, including hidden `CharacterDocument` rows. Always sets `X-Skip-Cache: true` |

Both endpoint groups share the same `CharacterDocumentSerializer`/`CharacterDocumentAllSerializer`
pair the index endpoints already use — there is no separate "detail" tier, since no `description`
field exists at any tier for `CharacterDocument` (unlike `CharacterItem`'s detail tier).

**Exposed fields** (read): `id` (the `CharacterDocument` row id, not the `GameDocument` id),
`game_document_id`, `name`, `photo_path` — all sourced directly from the linked `GameDocument`,
so the frontend never needs its own fallback logic. `hidden` is exposed on the `/all.json` and
`/full.json` variants only.

## `hidden`

Governs only whether a `CharacterDocument` row itself is included in the regular
(non-`/all.json`/non-`/full.json`) endpoints above — it says nothing about the visibility of the
`GameDocument` it links to (see [GameDocument](game-document.md) above for that model's own,
independent `hidden`). A hidden `CharacterDocument` is still fully visible to the character's
owning player (PC) or that game's GameMaster/superuser, via the appropriate `/all.json`/
`/full.json` endpoint.

Unlike [CharacterTreasure](character-treasure.md)'s NPC-only hidden-held-item filter (`hidden`
there lives on the separate `GameTreasure` catalog row, and a PC keeps seeing every treasure it
owns regardless of catalog visibility), `CharacterDocument.hidden` lives directly on the
character's own row — so **both** the PC and NPC regular endpoints exclude a character's own
hidden documents; only the DM/owner-facing `/all.json`/`/full.json` variants reveal them.
