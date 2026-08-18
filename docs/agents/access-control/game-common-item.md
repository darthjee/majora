# GameCommonItem

**[Game resource](principles.md#resource-categories).** A `GameCommonItem` is a game-level,
priced catalog entry for a common/mundane item of interest (a potion, a drug, ammunition, ...) —
its own `name`, `price`, `description`, `category`, and optional `photo` directly, plus a `hidden`
flag scoping visibility within the game's catalog. No dedicated delete endpoint (Django-admin-only
for superusers). Unlike [GameItem](game-item.md)/[GamePossession](game-possession.md), no
character ever owns a `GameCommonItem` — there is no `CharacterCommonItem` counterpart; it is
purely a game-level reference list (issue #826).

Follows the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern). **Update**
(`PATCH .../common_items/<common_item_id>.json`) shares the same broader **Regular** tier (staff +
any player of the game) as **Create** and **photo upload**, checked inline via
`EndpointPermission(request.user, game=game).check(request, 'game_common_item', 'regular', 'edit')`
against
[`game_common_item/endpoints.yml`](../../../backend/permissions/config/game_common_item/endpoints.yml)'s
`regular.edit` key — the dm/admin/superuser shortcut still applies via `EndpointPermission`.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/common_items.json` | GET | **AllowAny** — non-hidden common items |
| `/games/<slug>/common_items/all.json` | GET | **GameEdit** — includes hidden, adds `hidden` field. Always `X-Skip-Cache: true` |
| `/games/<slug>/common_items/<common_item_id>.json` | GET | **AllowAny** — 404 if hidden or unknown |
| `/games/<slug>/common_items/<common_item_id>/full.json` | GET | **GameEdit** — returns even if hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/common_items/<common_item_id>.json` | PATCH | roles per [`game_common_item/endpoints.yml`](../../../backend/permissions/config/game_common_item/endpoints.yml) (`edit`: staff + player) |
| `/games/<slug>/common_items.json` | POST | roles per [`game_common_item/endpoints.yml`](../../../backend/permissions/config/game_common_item/endpoints.yml) (`create`: staff + player; no owner concept) |
| `/games/<slug>/common_items/<common_item_id>/photo_upload.json` | POST | `IsAuthenticated` + roles per [`game_common_item/endpoints.yml`](../../../backend/permissions/config/game_common_item/endpoints.yml) (`photo_upload`: staff + player) |
| `/permissions/game_common_item.json` | GET | entity-agnostic, role-simulated `can_edit` (mirrors `permissions/game_possession.json`) |

Both index endpoints order by `id`; `description` is omitted from both (present on detail
endpoints instead). `PATCH` shares the same route as `GET` on the plain detail endpoint; only
`name`/`description`/`price`/`category`/`hidden` are writable — `photo` stays on its own upload
endpoint, which uses a fixed, deterministic path (`use_uuid=False`) since a common item has at
most one photo, always replaced on re-upload (mirrors `GamePossession`'s single-always-replace
model, not `GameDocument`'s multi-photo gallery).

## Fields

List: `id`, `name`, `photo_path`, `price`, `category` — see [Photo path
fields](common-rules.md#photo-path-fields). Unlike `GamePossession`, `price`/`category` surface at
list level (not just detail) since the whole point of the catalog is browsing prices/categories
without opening each item. Detail adds `description`. `/all.json`/`/full.json`/create-response add
`hidden`.

**Write fields** (create/update): `name` (required for create, ≤200 chars), `price` (required for
create, `IntegerField`, `min_value=0` — no separate currency/unit field, same convention as
[Treasure](treasure.md)'s `value`), `description` (defaults to `''`), `category` (defaults to
`other`; fixed choice list: `potion`, `drug`, `consumable`, `ammunition`, `poison`, `gear`,
`other`, applied uniformly regardless of the owning game's `game_type`), `hidden` (defaults to
`false`).

## No character ownership

`GameCommonItem` carries no PC/NPC ownership or acquisition concept at all — game-level CRUD only,
with no analog to `CharacterPossession`/`CharacterItem`. `GameItem`/`CharacterItem` are unrelated
and untouched by this resource: `GameCommonItem` exists specifically for mundane, non-unique items
that don't warrant a character-owned copy.
