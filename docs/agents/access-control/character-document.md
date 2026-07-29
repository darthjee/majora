# CharacterDocument

`CharacterDocument` links a `Character` (PC or NPC) to a `GameDocument`. It is a thin join —
`name`/`description`/`photo_path` are always sourced straight from the linked `GameDocument` (see
[GameDocument](game-document.md) above), with no override/fallback logic left on
`CharacterDocument` itself. `hidden` is a plain `BooleanField` (default `False`), never
inherited from `GameDocument.hidden`. `unique_together = ('character', 'game_document')` — a
character can hold at most one row per `GameDocument`. Four index endpoints (one PC pair, one
NPC pair), four show/detail endpoints (one PC pair, one NPC pair), and eight files/photos
shortlist endpoints (one PC pair, one NPC pair, each split files/photos, each split
public/`/all.json`) expose read access; there is no create endpoint, no update endpoint, and no
photo upload endpoint for `CharacterDocument` itself (left for follow-up issues, if ever needed),
only Django admin for superusers.

## Document index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/documents.json` | GET | **AllowAny** | Paginated list of `CharacterDocumentSerializer` objects (`id`, `game_document_id`, `name`, `description`, `photo_path`) for that PC's non-hidden `CharacterDocument` rows |
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
pair the index endpoints already use — there is no separate "detail" tier, unlike
`CharacterItem`'s detail tier: `description` is exposed at every tier (index, detail,
`/all.json`, `/full.json` alike), not gated behind a narrower endpoint the way `CharacterItem`'s
`description` is.

**Exposed fields** (read): `id` (the `CharacterDocument` row id, not the `GameDocument` id),
`game_document_id`, `name`, `description`, `photo_path` — all sourced directly from the linked
`GameDocument`, so the frontend never needs its own fallback logic. `hidden` is exposed on the
`/all.json` and `/full.json` variants only.

## Document files/photos shortlist endpoints

`CharacterDocument` carries no files/photos of its own — a character possessing a `GameDocument`
can list and see that document's own `GameDocumentFile`/`GameDocumentPhoto` rows. Eight endpoints
(one PC pair, one NPC pair, each split files/photos, each split public/`/all.json`) read through a
single `CharacterDocument` (looked up by its own id, matching
the show/detail endpoints above — **not** the underlying `GameDocument`'s id) to its
`game_document.files`/`game_document.photos`, filtered to `ready=True`:

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/pcs/<id>/documents/<document_id>/files.json` | GET | **AllowAny**, see gating below | Paginated `CharacterDocumentFileSerializer` list (`id`, `character_document_id`, `name`, `path`, `photo_path`) of the held document's ready files |
| `/games/<slug>/pcs/<id>/documents/<document_id>/files/all.json` | GET | **CharacterEdit** | Same shape, dm/owner/admin only, ignores all hidden/incognito state |
| `/games/<slug>/npcs/<id>/documents/<document_id>/files.json` | GET | **AllowAny**, see gating below (plus the [hidden-NPC gate](character-photo.md#photo-index-endpoints)) | Same shape as the PC variant |
| `/games/<slug>/npcs/<id>/documents/<document_id>/files/all.json` | GET | **GameEdit** (no owner concept for NPCs) | Same shape, dm/admin only, ignores all hidden/incognito state |
| `/games/<slug>/pcs/<id>/documents/<document_id>/photos.json` | GET | **AllowAny**, see gating below | Paginated `CharacterDocumentPhotoSerializer` list (`id`, `character_document_id`, `path`) of the held document's ready photos |
| `/games/<slug>/pcs/<id>/documents/<document_id>/photos/all.json` | GET | **CharacterEdit** | Same shape, dm/owner/admin only, ignores all hidden/incognito state |
| `/games/<slug>/npcs/<id>/documents/<document_id>/photos.json` | GET | **AllowAny**, see gating below (plus the [hidden-NPC gate](character-photo.md#photo-index-endpoints)) | Same shape as the PC variant |
| `/games/<slug>/npcs/<id>/documents/<document_id>/photos/all.json` | GET | **GameEdit** (no owner concept for NPCs) | Same shape, dm/admin only, ignores all hidden/incognito state |

`CharacterDocumentFileSerializer`/`CharacterDocumentPhotoSerializer` are not `ModelSerializer`s
over a `CharacterDocument`-owned table (no such table exists) — they serialize the underlying
`GameDocumentFile`/`GameDocumentPhoto` rows directly (mirroring
`GameDocumentFileSerializer`/`GameDocumentPhotoSerializer`, see [GameDocument](game-document.md)
above), adding `character_document_id` from the requested `CharacterDocument` via serializer
`context`, since a `GameDocumentFile`/`GameDocumentPhoto` has no back-reference to which
`CharacterDocument` it is being listed under (a `GameDocument`, and therefore its files/photos,
can be held by more than one character).

**Gating** (public variant, both files and photos): 404 if the `CharacterDocument` is `hidden`
(same lookup/exclusion as the show/detail endpoints above); for NPCs only, also 404 if the
`Character` itself is `hidden` (a PC's own `hidden` flag never gates its document endpoints, same
as everywhere else in this document); `[]` (an empty paginated response, not a 404) if the
`Character` is `incognito` — see "Incognito field" in [Character](character.md#incognito-field)
for this new extension of `incognito`'s scope. `GameDocument.hidden` is ignored by both the public
and private variant: a character possessing a document may see its files/photos regardless of
whether the DM has made the document itself public yet, mirroring how `GameDocument.hidden` is
already ignored by the show/detail endpoints above. The private `/all.json` variant ignores
`CharacterDocument.hidden`, `Character.hidden`, and `Character.incognito` alike (same as the
`/all.json`/`/full.json` endpoints above), and applies the same PC-vs-NPC `CharacterEdit`/
`GameEdit` permission split as `documents/all.json` (`_check_character_all_permission`), no Staff
bypass. Always sets `X-Skip-Cache: true` on the `/all.json` responses, and on a public response
served through the NPC hidden-character gate to an authorized dm/superuser (same convention as
the other NPC document endpoints above).

Unknown `game_slug`/`character_id`/`document_id` (or mismatched/wrong type, or a `document_id`
that resolves to a different character's `CharacterDocument`) → 404 on all eight endpoints. All
eight paginate identically to the rest of this app (`Paginator`/`paginated_list_response`).

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
