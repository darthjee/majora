# GamePossession

**[Game resource](principles.md#resource-categories).** A `GamePossession` represents a large,
unique belonging within a game (a house, a boat, a tavern) — the same shape as
[GameItem](game-item.md): its own `name`, `description`, and optional `photo` directly, plus a
`hidden` flag scoping visibility within the game's catalog. No dedicated delete endpoint
(Django-admin-only for superusers). `GamePossession` itself carries no PC/NPC ownership/
acquisition — game-level CRUD only; ownership is tracked separately, on
[CharacterPossession](character-possession.md) (issue #1076).

Follows the [default hidden-gated collection
pattern](principles.md#default-hidden-gated-collection-pattern). **Update**
(`PATCH .../possessions/<possession_id>.json`) shares the same broader **Regular** tier (staff +
any player of the game) as **Create** and **photo upload**, checked inline via
`EndpointPermission(request.user, game=game).check(request, 'game_possession', 'regular', 'edit')`
against
[`game_possession/endpoints.yml`](../../../backend/permissions/config/game_possession/endpoints.yml)'s
`regular.edit` key — the dm/admin/superuser shortcut still applies via `EndpointPermission`.

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/possessions.json` | GET | **AllowAny** — non-hidden possessions |
| `/games/<slug>/possessions/all.json` | GET | **GameEdit** — includes hidden, adds `hidden` field. Always `X-Skip-Cache: true` |
| `/games/<slug>/possessions/<possession_id>.json` | GET | **AllowAny** — 404 if hidden or unknown |
| `/games/<slug>/possessions/<possession_id>/full.json` | GET | **GameEdit** — returns even if hidden, adds `hidden`. Always `X-Skip-Cache: true` |
| `/games/<slug>/possessions/<possession_id>.json` | PATCH | roles per [`game_possession/endpoints.yml`](../../../backend/permissions/config/game_possession/endpoints.yml) (`edit`: staff + player) |
| `/games/<slug>/possessions.json` | POST | roles per [`game_possession/endpoints.yml`](../../../backend/permissions/config/game_possession/endpoints.yml) (`create`: staff + player; no owner concept) |
| `/games/<slug>/possessions/<possession_id>/photo_upload.json` | POST | `IsAuthenticated` + roles per [`game_possession/endpoints.yml`](../../../backend/permissions/config/game_possession/endpoints.yml) (`photo_upload`: staff + player) |

Both index endpoints order by `id`; `description` is omitted from both (present on detail
endpoints instead). `PATCH` shares the same route as `GET` on the plain detail endpoint; only
`name`/`description`/`hidden` are writable — `photo` stays on its own upload endpoint, which uses
a fixed, deterministic path (`use_uuid=False`) since a possession has at most one photo, always
replaced on re-upload (mirrors `GameItem`'s single-always-replace model, not `GameDocument`'s
multi-photo gallery).

## Fields

List: `id`, `name`, `photo_path` — see [Photo path fields](common-rules.md#photo-path-fields).
Detail adds `description`. `/all.json`/`/full.json`/create-response add `hidden`.

**Write fields** (create/update): `name` (required for create, ≤200 chars), `description`
(defaults to `''`), `hidden` (defaults to `false`).

## Possession creation endpoint

Creates only a `GamePossession` — no ownership row (a [CharacterPossession](character-possession.md)
linking it to a character is a separate, later step, either acquired via that endpoint's own
create-from-scratch action or via the acquire flow). A `can_create_possession` boolean (same role
gating: staff + player) is also exposed on [Game](game.md)'s `permissions.json`, mirroring
`can_create_item`/`can_create_document`.
