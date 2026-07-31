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
