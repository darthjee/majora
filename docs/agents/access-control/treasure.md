# Treasure

**[Game resource](principles.md#resource-categories)**, but with a global catalog as well as a
game-scoped one. Treasures are global by default, optionally exclusive to one game (`game` FK),
and/or M2M-linked to any number of games via [GameTreasure](game-treasure.md) — independently.

All read endpoints are **AllowAny**, matching the [default resource CRUD
pattern](principles.md#default-resource-crud-pattern). Create/Update deviate from the plain
per-resource `<Resource>Edit` rule:

| Action | Who can |
|--------|---------|
| List (`GET /treasures.json`) | **AllowAny** — global treasures only (`game__isnull=True`) |
| Detail (`GET /treasures/<id>.json`) | **AllowAny** |
| Create (global, `POST /treasures.json`) | **TreasureEdit**: superuser or staff |
| Update (global, `PATCH /treasures/<id>.json`) | **TreasureEdit** — staff only for a truly global treasure; includes the owning game's GameMaster for a game-exclusive one |
| Photo upload (global, `POST /treasures/<id>/photo_upload.json`) | Superuser always; additionally that treasure's owning game's GameMaster when exclusive to a game |
| List by game (`GET /games/<slug>/treasures.json`) | **AllowAny** — union of M2M-linked and exclusive treasures for that game, excluding any hidden for this game (see [GameTreasure](game-treasure.md#hidden)) |
| List all by game (`GET /games/<slug>/treasures/all.json`) | **GameEdit** — same union, no hidden exclusion, each item carries `hidden`. Always `X-Skip-Cache: true` |
| List missing from a game (`GET /games/<slug>/treasures/missing.json`) | **GameEdit** — catalog treasures of matching `game_type` not yet linked to this game. Always `X-Skip-Cache: true` |
| Link existing treasure to a game (`POST /games/<slug>/treasures/link.json`) | **GameEdit** — creates a `GameTreasure` row for an existing catalog treasure |
| Detail by game (`GET /games/<slug>/treasures/<id>.json`) | **AllowAny**, unless hidden for this game and the requester cannot edit the game (404 either way — mismatched game, or hidden-and-unauthorized) |
| Create by game (`POST /games/<slug>/treasures.json`) | **GameEdit** — creates a new exclusive treasure; `game` server-assigned |
| Update by game (`PATCH /games/<slug>/treasures/<id>.json`) | **GameEdit** — same 404 rule as detail |
| Delete | Superuser only, via Django admin — no API delete endpoint exists |

`Treasure.can_be_edited_by` is used only for the global routes; the game-scoped routes always
check **GameEdit** against the resolved game directly instead (see [Common
Rules](common-rules.md)).

## Fields

**List/detail**: `id`, `name`, `value`, `photo_path`, `game_slug`, `available_units`, `max_units`
— see [GameTreasure](game-treasure.md) for how `value`/`available_units`/`max_units` resolve.
`GET /games/<slug>/treasures/all.json` additionally exposes `hidden` — no other read endpoint
does. `game_slug` is the slug of the game the treasure is *exclusively* owned by, or `null` when
global or only M2M-linked.

**Write fields** (create/update): `name` (required for create), `value` (required for create).
`photo_path`/`game_slug` are read-only/server-assigned. `hidden` is accepted in the request body
on the game-scoped endpoints (and the global update for an exclusive treasure) but is written onto
the treasure's [GameTreasure](game-treasure.md) row, not the `Treasure` row itself — see that
file's `hidden` section for the full read/write/filter rules. A genuinely global treasure (no
owning/linked game) has no `GameTreasure` row, so `hidden` is silently dropped on the global
create/update endpoints when `game_id` is `None` — a deliberate scope limit, not an oversight,
since global treasures are already fully public by design.

## `max_value` filter

`GET /games/<slug>/treasures.json` accepts an optional `max_value` (integer) filter and an
`?ordering=asc|desc`, both against the same per-game resolved `value` — see
[CharacterTreasure](character-treasure.md#max_value-filter-on-the-game-treasure-list). Exposes no
additional data, only narrows/reorders the same publicly readable list.

## Edit access status

`GET /treasures/<id>/access.json` — **AllowAny**, standard shape per [Access status
endpoints](common-rules.md#access-status-endpoints-accessjson). Edit permission is `true` via
*either* path: superuser/staff (global rule) **or** GameEdit against the owning game (when
exclusive to one).

## Edit permission

Two entity-agnostic routes, per [Edit permission
endpoints](common-rules.md#edit-permission-endpoints-permissionsjson) — both **AllowAny**, no path
parameters, response `{"can_edit": <bool>}`:

- `GET /permissions/treasure.json` — the global (gameless) action. With no `role` param,
  `can_edit` includes staff, per the table above. With a `role` param, it remains superuser-only
  even under simulation: `dm` is a no-op there, and `staff` is intentionally never simulated.
- `GET /permissions/game_treasure.json` — the game-exclusive action. `dm` additionally grants
  `can_edit` under simulation (a real/simulated dm is scoped to "some game", which is enough here
  since there's no specific instance to check against); `staff` does not.

Which route to call for a given treasure is the caller's responsibility — determined by whether
that treasure's `game_slug` (from its already-loaded detail) is `null` (global) or not
(game-exclusive) — since the entity id no longer travels in either URL. This
staff-granted-for-real-but-not-under-simulation asymmetry between the two routes is intentional.
