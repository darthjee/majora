# GameDocument

A `GameDocument` is a special document belonging to exactly one game (`game` FK, `CASCADE`) —
field-for-field a mirror of [GameItem](game-item.md): it holds its own `name`, `description`,
and optional `photo` directly, plus a `hidden` (`BooleanField`, default `False`) flag scoping its
visibility within that game's catalog. There is no dedicated create/update/delete endpoint, and
no photo upload endpoint, for `GameDocument` in this issue — it is read-only, via the two index
endpoints below (creation, update, and photo upload are explicitly out of scope, left for a
follow-up issue; the `photo` FK and its backing `GameDocumentPhoto` model exist as schema only,
so `photo_path` is always `null` for now).

## Document index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/documents.json` | GET | **AllowAny** | Paginated list of `GameDocumentListSerializer` objects (`id`, `name`, `photo_path`) for the game's non-hidden documents |
| `/games/<slug>/documents/all.json` | GET | **GameEdit** | DM-only variant: does not exclude hidden documents, and each document additionally carries a `hidden: boolean` field (via `GameDocumentAllListSerializer`, a `GameDocumentListSerializer` subclass used only by this endpoint). Always sets `X-Skip-Cache: true` |

Unknown `game_slug` → 404. Both endpoints order by `id`.

**Exposed fields** (read, index): `id`, `name`, `photo_path` — all non-sensitive; `description`
is intentionally omitted from both index endpoints (there is no detail endpoint in this issue
where it could be exposed instead). `GET /games/<slug>/documents/all.json` additionally exposes
`hidden` — see the `hidden` section below; no other read endpoint exposes it.

`photo_path` — see [Photo path fields](common-rules.md#photo-path-fields) above; always `null`
for now, since no upload endpoint exists yet for `GameDocument.photo`.

## `hidden`

`hidden` lives directly on `GameDocument` (not on a separate per-game link row, since
`GameDocument` already belongs to exactly one game) — a plain field, default `False`, never
inherited by a `CharacterDocument` that links to it (see
[CharacterDocument](character-document.md) below, whose own `hidden` is independent). It is:
- Excluded from `GET /games/<slug>/documents.json` (the regular catalog list).
- Exposed (per document) only on `GET /games/<slug>/documents/all.json`, gated by
  `GameEditPermission` (that game's GameMaster, or a superuser/staff) — the same permission
  class used by `GET /games/<slug>/items/all.json`.

There is no buy/sell flow, or NPC/PC "held document hidden" filter tied to
`GameDocument.hidden` itself — see [CharacterDocument](character-document.md) below for the
separate, per-character `hidden` flag that governs a PC's/NPC's own held-document list.
