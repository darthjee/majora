# GameDocument

A `GameDocument` is a special document belonging to exactly one game (`game` FK, `CASCADE`) —
field-for-field a mirror of [GameItem](game-item.md): it holds its own `name`, `description`,
and optional `photo` directly, plus a `hidden` (`BooleanField`, default `False`) flag scoping its
visibility within that game's catalog. There is still no dedicated update/delete endpoint, or
photo upload endpoint, for `GameDocument` (out of scope, left for follow-up issues; the `photo`
FK and its backing `GameDocumentPhoto` model exist as schema only, so `photo_path` is always
`null` for now) — but issue #758 added a dm/admin/staff `POST` endpoint that creates a bare
`GameDocument` with no owning `CharacterDocument` (see "Document creation endpoint" below), plus
public/dm-only show endpoints (see "Document detail endpoints" below).

## Document index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/documents.json` | GET | **AllowAny** | Paginated list of `GameDocumentListSerializer` objects (`id`, `name`, `photo_path`) for the game's non-hidden documents |
| `/games/<slug>/documents/all.json` | GET | **GameEdit** | DM-only variant: does not exclude hidden documents, and each document additionally carries a `hidden: boolean` field (via `GameDocumentAllListSerializer`, a `GameDocumentListSerializer` subclass used only by this endpoint). Always sets `X-Skip-Cache: true` |

Unknown `game_slug` → 404. Both endpoints order by `id`.

**Exposed fields** (read, index): `id`, `name`, `photo_path` — all non-sensitive; `description`
is intentionally omitted from both index endpoints (card/preview UI never renders it — see
`GameDocumentDetailSerializer` below for where it is exposed). `GET /games/<slug>/documents/all.json`
additionally exposes `hidden` — see the `hidden` section below; no other read endpoint exposes it.

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

## Document detail endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/documents/<document_id>.json` | GET | **AllowAny** | `GameDocumentDetailSerializer` object (`id`, `name`, `photo_path`, `description`) for a single non-hidden document; 404 if the document is hidden or unknown |
| `/games/<slug>/documents/<document_id>/full.json` | GET | **GameEdit** | DM-only variant: returns the document even if hidden, and additionally carries `hidden` (via `GameDocumentDetailFullSerializer`). Always sets `X-Skip-Cache: true` |

Unknown `game_slug` or `document_id` (or a document belonging to a different game) → 404. `GET`
mirrors the two index endpoints above in permission/visibility semantics, narrowed to a single
row, but uses detail-only serializer subclasses (`GameDocumentDetailSerializer`/
`GameDocumentDetailFullSerializer`, each extending the corresponding index serializer) that add
`description` back on top of the lean index fields — no permission class changed. There is no
`PATCH` for `GameDocument` (out of scope — unlike `GameItem`'s `PATCH .../items/<item_id>.json`).
Error responses: `401` `{"errors": {"detail": ["authentication required"]}}` if unauthenticated
and not permitted (full endpoint only); `403` `{"errors": {"detail": ["not allowed"]}}` if
authenticated but not permitted (full endpoint only).

## Document creation endpoint

| Endpoint | Method | Who can call | Request | Response |
|----------|--------|-------------|---------|----------|
| `/games/<slug>/documents.json` | POST | **GameDocumentCreatePermission** — dm, admin, or staff (no owner concept — a bare `GameDocument` has no owning character) | `{ name: string, description?: string, hidden?: boolean }` (`name` required, ≤200 chars; `description` defaults to `''`; `hidden` defaults to `false`) | `201` with `GameDocumentDetailFullSerializer` shape (`id`, `name`, `photo_path`, `description`, `hidden`) |

Shares the same route as the `GET` index endpoint above (`game_documents` now handles both `GET`
and `POST`; `AllowAny` stays at the decorator level so `GET` remains public, with `POST`
authorized inline via `GameDocumentCreatePermission.check`). Creates only a `GameDocument` — no
`CharacterDocument` is created, unlike [CharacterItem](character-item.md)'s equivalent PC/NPC
creation pattern for items. Error responses: `401`
`{"errors": {"detail": ["authentication required"]}}` if unauthenticated; `403`
`{"errors": {"detail": ["not allowed"]}}` if authenticated but not permitted; `404` for an unknown
`game_slug`; `400` `{"errors": {"<field>": ["<message>", ...]}}` on validation failure.

`GameDocumentCreatePermission` (`backend/games/permissions.py`) is `user.is_staff or
game.can_be_edited_by(user)` — mirrors `GameItemCreatePermission`'s shape exactly, since a bare
`GameDocument` has no owning character. A `can_create_document` boolean (backed by the same
permission, including its Staff bypass) is also exposed on the existing
`GET /games/<slug>/permissions.json` response (`GamePermissionsSerializer`), for both the
real-identity and role-simulated (`?role=`) paths, so the frontend can gate its "Create Document"
button off an authoritative server-computed flag — see [Game](game.md)'s "Edit permission"
section above.
