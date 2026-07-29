# GameItem

A `GameItem` is a special magic item belonging to exactly one game (`game` FK, `CASCADE`) —
unlike `Treasure`, there is no shared cross-game registry: `GameItem` is the top of the item
hierarchy, holding its own `name`, `description`, and optional `photo` directly (parallel to how
`GameTreasure` merely links a game to a separately-owned `Treasure`, `GameItem` needs no such
through model). There is still no dedicated delete endpoint (left for follow-up issues; deletion
remains Django-admin-only for superusers).

Follows the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern), with one deviation: **Update**
(`PATCH .../items/<item_id>.json`) is gated by plain **GameEdit** (dm/admin/superuser only, no
staff bypass), not the same `GameItemCreatePermission` used for Create (which also grants staff).
`GameItem.hidden` lives directly on the model (a plain field, default `False`) — independent of
[CharacterItem](character-item.md)'s own, separate `hidden` flag on a character's held-item row;
there is no buy/sell flow or NPC/PC "held item hidden" filter tied to `GameItem.hidden` itself.

## Item index endpoints

| Endpoint | Method | Who can call | Response |
|----------|--------|-------------|----------|
| `/games/<slug>/items.json` | GET | **AllowAny** | Paginated list of `GameItemListSerializer` objects (`id`, `name`, `photo_path`) for the game's non-hidden items |
| `/games/<slug>/items/all.json` | GET | **GameEdit** | Same lean fields, plus a `hidden: boolean` field (via `GameItemAllListSerializer`), and does not exclude hidden items. Always sets `X-Skip-Cache: true` |

Unknown `game_slug` → 404. Both endpoints order by `id`. `description` is intentionally omitted
from both index endpoints (card/preview UI never renders it — see the detail endpoints below for
where it is exposed).

`photo_path` — see [Photo path fields](common-rules.md#photo-path-fields) above; `null` when the
item has no `photo` set.

## Item detail endpoints

| Endpoint | Method | Who can call | Request | Response |
|----------|--------|-------------|---------|----------|
| `/games/<slug>/items/<item_id>.json` | GET | **AllowAny** | — | `GameItemDetailSerializer` object (`id`, `name`, `photo_path`, `description`) for a single non-hidden item; 404 if the item is hidden or unknown |
| `/games/<slug>/items/<item_id>/full.json` | GET | **GameEdit** | — | Returns the item even if hidden, and additionally carries `hidden` (via `GameItemDetailFullSerializer`). Always sets `X-Skip-Cache: true` |
| `/games/<slug>/items/<item_id>.json` | PATCH | **GameEdit** (dm/admin/superuser only) | Partial `{ name?, description?, hidden? }` (`GameItemUpdateSerializer`; blank `name`/`description` rejected — `GameItem` has no fallback target) | `200` with `GameItemDetailFullSerializer` shape (fetched via `game.items.all()`, so an already-hidden item can also be patched) |

Unknown `game_slug` or `item_id` (or an item belonging to a different game) → 404. `PATCH` shares
the same route as `GET` (`game_item_detail` handles both) but only `name`/`description`/`hidden`
are writable — `photo` stays on its own dedicated upload endpoint (still out of scope for
`GameItem`). Error responses: `401` `{"errors": {"detail": ["authentication required"]}}` if
unauthenticated; `403` `{"errors": {"detail": ["not allowed"]}}` if authenticated but not
permitted; `400` `{"errors": {"<field>": ["<message>", ...]}}` on validation failure (e.g. blank
`name`).

## Item creation endpoint

| Endpoint | Method | Who can call | Request | Response |
|----------|--------|-------------|---------|----------|
| `/games/<slug>/items.json` | POST | **GameItemCreatePermission** — dm, admin, or staff (no owner concept — a bare `GameItem` has no owning character) | `{ name: string, description?: string, hidden?: boolean }` (`name` required, ≤200 chars; `description` defaults to `''`; `hidden` defaults to `false`) | `201` with `GameItemDetailFullSerializer` shape (`id`, `name`, `photo_path`, `description`, `hidden`) |

Shares the same route as the `GET` index endpoint above (`game_items` now handles both `GET` and
`POST`; `AllowAny` stays at the decorator level so `GET` remains public, with `POST` authorized
inline via `GameItemCreatePermission.check`). Creates only a `GameItem` — no `CharacterItem` is
created, unlike [CharacterItem](character-item.md)'s PC/NPC `POST .../items.json` pair, which
always creates a `GameItem`/`CharacterItem` pair together. Error responses: `401`
`{"errors": {"detail": ["authentication required"]}}` if unauthenticated; `403`
`{"errors": {"detail": ["not allowed"]}}` if authenticated but not permitted; `404` for an unknown
`game_slug`; `400` `{"errors": {"<field>": ["<message>", ...]}}` on validation failure.

`GameItemCreatePermission` (`backend/games/permissions.py`) is `user.is_staff or
game.can_be_edited_by(user)` — mirrors `CharacterItemCreatePermission`'s shape minus the PC-owner
allowance, since a bare `GameItem` has no owning character. A `can_create_item` boolean (backed
by the same permission, including its Staff bypass) is also exposed on the existing
`GET /games/<slug>/permissions.json` response (`GamePermissionsSerializer`), for both the
real-identity and role-simulated (`?role=`) paths, so the frontend can gate its "Create Item"
button off an authoritative server-computed flag — see [Game](game.md)'s "Edit permission"
section above.
