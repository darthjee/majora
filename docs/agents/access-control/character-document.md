# CharacterDocument

**[Game resource](principles.md#resource-categories).** `CharacterDocument` links a `Character`
(PC or NPC) to a `GameDocument`. A thin join — `name`/`description`/`photo_path` are always
sourced straight from the linked `GameDocument` (see [GameDocument](game-document.md)), with no
override/fallback logic. `hidden` is a plain field, never inherited from `GameDocument.hidden`.
`unique_together = ('character', 'game_document')`. No create, update, or photo-upload endpoint
for `CharacterDocument` itself (Django admin only).

The index/detail pairs follow the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern) — no Create/Update deviation to
state, since neither exists. The files/photos shortlist endpoints and the `incognito` interaction
are deviations, covered below.

## Index and detail endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs/<id>/documents.json` | GET | **AllowAny** — non-hidden |
| `/games/<slug>/pcs/<id>/documents/all.json` | GET | **CharacterEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/documents.json` | GET | **AllowAny**, plus the [hidden-NPC gate](character-photo.md#hidden-npc-gate) |
| `/games/<slug>/npcs/<id>/documents/all.json` | GET | **GameEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/pcs/<id>/documents/<document_id>.json` | GET | **AllowAny** — 404 if hidden or unknown |
| `/games/<slug>/pcs/<id>/documents/<document_id>/full.json` | GET | **CharacterEdit** — includes hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/npcs/<id>/documents/<document_id>.json` | GET | **AllowAny**, plus the hidden-NPC gate (sets `X-Skip-Cache: true` when served to an authorized dm/superuser through that gate) |
| `/games/<slug>/npcs/<id>/documents/<document_id>/full.json` | GET | **GameEdit** (no owner concept for NPCs) |

All order by `id`. Unlike `CharacterItem`, `description` is exposed at every tier (no separate
"detail" tier gating it further).

## Fields

`id` (the `CharacterDocument` row id), `game_document_id`, `name`, `description`, `photo_path` —
all sourced directly from the linked `GameDocument`. `hidden` is exposed on the `/all.json`/
`/full.json` variants only.

## Document available (Acquire catalog) endpoints

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs\|npcs/<id>/documents/available.json` | GET | **AllowAny** — the game's `GameDocument` catalog minus hidden documents and documents the character already owns |
| `/games/<slug>/pcs\|npcs/<id>/documents/available/all.json` | GET | **GameEdit** (dm/admin only — **no owner leniency**, unlike the document-index `/all.json` endpoints) — includes hidden. Always `X-Skip-Cache: true` |

Backs the document-exchange modal's Acquire tab (issue #920), since `CharacterDocument` allows at
most one instance per document (`unique_together = ('character', 'game_document')`) — the catalog
must exclude already-owned documents rather than show a duplicate-acquire affordance. Mirrors
[CharacterItem](character-item.md)'s own available/acquire pair exactly: the `/all.json` variant
here is deliberately **game-level** (no owner), a narrower gate than `documents/all.json`'s own
`CharacterEditPermission` (which does include the PC's owning player) — a PC's owning player must
not get hidden-catalog visibility just by owning the character. Supports `?name=` (case-insensitive
substring on `GameDocument.name`) and standard pagination.

## Document acquire/remove endpoints

| Endpoint | Method | Who can call | Effect |
|----------|--------|-------------|--------|
| `/games/<slug>/pcs\|npcs/<id>/documents/acquire.json` | POST | `restricted.create` on the `game_pc_document`/`game_npc_document` resource — per [`game_pc_document/endpoints.yml`](../../../backend/games/permissions/config/game_pc_document/endpoints.yml) (`staff`, `owner`) / [`game_npc_document/endpoints.yml`](../../../backend/games/permissions/config/game_npc_document/endpoints.yml) (`staff` only) | Creates a `CharacterDocument` for the submitted `game_document_id`. `404` if the `GameDocument` is hidden (never bypassed here) or unknown; **`422`** if already owned |
| `/games/<slug>/pcs\|npcs/<id>/documents/remove.json` | POST | Same permission as acquire above | Deletes the character's `CharacterDocument` row for the submitted document. `404` if not owned, or owned but hidden (never bypassed here) |
| `/games/<slug>/pcs\|npcs/<id>/documents/acquire/all.json` | POST | **GameEdit** (dm/admin only, no staff leniency beyond what GameEdit grants) | DM-only variant: does not `404` on a hidden `GameDocument` |
| `/games/<slug>/pcs/<id>/documents/remove/all.json` | POST | **CharacterEdit** (dm, admin, or the PC's owning player — **not** staff) | Does not `404` on a hidden owned `CharacterDocument` |
| `/games/<slug>/npcs/<id>/documents/remove/all.json` | POST | **GameEdit** (dm/admin only) | Does not `404` on a hidden owned `CharacterDocument` |

Two **distinct** permission scopes are load-bearing and must not be conflated, exactly as with
[CharacterItem](character-item.md#item-acquireremove-endpoints): **catalog visibility**
(`available/all`, `acquire/all`) is game-level, dm/admin only, no owner; **owned-document
visibility** (`remove/all`) is character-level, using the same asymmetric PC/NPC split
`documents/all.json` already uses. Like `CharacterItem`, there is no `quantity` — acquire always
creates exactly one row, remove always deletes the row outright. Unlike `CharacterItem`, acquiring
an already-owned document returns **`422`** (not `400`) — a deliberate divergence from the Item
precedent, decided during issue #920's `/enhance-issue` pass.

## Document files/photos shortlist endpoints

`CharacterDocument` carries no files/photos of its own — a character possessing a `GameDocument`
can list that document's own `GameDocumentFile`/`GameDocumentPhoto` rows, looked up by the
`CharacterDocument`'s own id (not the underlying `GameDocument`'s), filtered to `ready=True`.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/pcs/<id>/documents/<document_id>/files.json` | GET | **AllowAny**, see gating below |
| `/games/<slug>/pcs/<id>/documents/<document_id>/files/all.json` | GET | **CharacterEdit** — ignores all hidden/incognito state |
| `/games/<slug>/npcs/<id>/documents/<document_id>/files.json` | GET | **AllowAny**, see gating below (plus the hidden-NPC gate) |
| `/games/<slug>/npcs/<id>/documents/<document_id>/files/all.json` | GET | **GameEdit** — ignores all hidden/incognito state |
| `/games/<slug>/pcs\|npcs/<id>/documents/<document_id>/photos.json` | GET | Same shape/gating as the files pair above |
| `/games/<slug>/pcs\|npcs/<id>/documents/<document_id>/photos/all.json` | GET | Same shape/gating as the files pair above |

**Fields**: files — `id`, `character_document_id`, `name`, `path`, `photo_path`; photos — `id`,
`character_document_id`, `path`.

**Gating** (public variant, both files and photos): `404` if the `CharacterDocument` itself is
hidden; for NPCs only, also `404` if the `Character` is hidden (a PC's own `hidden` never gates
its document endpoints); `[]` (empty paginated response, not `404`) if the `Character` is
`incognito` — see the [`incognito` convention](principles.md#incognito), an extension of its
cascade onto nested sub-resources. `GameDocument.hidden` is ignored by both variants — a character
possessing a document may see its files/photos regardless of whether the DM has made the document
itself public. The private `/all.json` variant ignores `CharacterDocument.hidden`,
`Character.hidden`, and `Character.incognito` alike, applying the same PC-vs-NPC
`CharacterEdit`/`GameEdit` split as `documents/all.json` (no staff bypass).

## `hidden`

Governs only whether a `CharacterDocument` row itself is listed on the regular
(non-`/all.json`/non-`/full.json`) endpoints — independent of [GameDocument](game-document.md)'s
own `hidden`. A hidden `CharacterDocument` stays fully visible to the character's owning player
(PC) or that game's GameMaster/superuser via the `/all.json`/`/full.json` variant. Like
[CharacterItem](character-item.md) (and unlike [CharacterTreasure](character-treasure.md)'s
catalog-row filter), `hidden` lives directly on the character's own row, so **both** PC and NPC
regular endpoints exclude a character's own hidden documents.
