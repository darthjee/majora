# GameItem

**[Game resource](principles.md#resource-categories).** A `GameItem` is a special magic item
belonging to exactly one game — the top of the item hierarchy, holding its own `name`,
`description`, and optional `photo` directly (unlike [GameTreasure](game-treasure.md), which
merely links a game to a separately-owned `Treasure`). No dedicated delete endpoint
(Django-admin-only for superusers).

Follows the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern), with one deviation: **Update**
(`PATCH .../items/<item_id>.json`) is gated by plain **GameEdit** (dm/admin/superuser only, no
staff bypass), not the broader `GameItemCreatePermission` used for Create. `GameItem.hidden` lives
directly on the model, independent of [CharacterItem](character-item.md)'s own `hidden` on a
character's held-item row — no buy/sell flow or NPC/PC "held item hidden" filter ties to it.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/items.json` | GET | **AllowAny** — non-hidden items |
| `/games/<slug>/items/all.json` | GET | **GameEdit** — includes hidden, adds `hidden` field. Always `X-Skip-Cache: true` |
| `/games/<slug>/items/<item_id>.json` | GET | **AllowAny** — 404 if hidden or unknown |
| `/games/<slug>/items/<item_id>/full.json` | GET | **GameEdit** — returns even if hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/items/<item_id>.json` | PATCH | **GameEdit** (no staff bypass) |
| `/games/<slug>/items.json` | POST | **GameItemCreatePermission**: dm, admin, or staff (no owner concept) |

Both index endpoints order by `id`; `description` is omitted from both (present on detail
endpoints instead). `PATCH` shares the same route as `GET` on the plain detail endpoint; only
`name`/`description`/`hidden` are writable — `photo` stays on its own upload endpoint.

## Fields
List: `id`, `name`, `photo_path` — see [Photo path fields](common-rules.md#photo-path-fields).
Detail adds `description`. `/all.json`/`/full.json`/create-response add `hidden`.

**Write fields** (create/update): `name` (required for create, ≤200 chars), `description`
(defaults to `''`), `hidden` (defaults to `false`) — blank `name`/`description` rejected (no
fallback target, unlike `CharacterItem`).

## Item creation endpoint
`GameItemCreatePermission` is `user.is_staff or game.can_be_edited_by(user)`. Creates only a
`GameItem` — no `CharacterItem` — unlike [CharacterItem](character-item.md)'s PC/NPC creation
pair, which always creates a `GameItem`/`CharacterItem` pair together. A `can_create_item` boolean
(same permission) is also exposed on [Game](game.md)'s `permissions.json`.
