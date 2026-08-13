# Faction

**[Game resource](principles.md#resource-categories).** A `Faction` is a game-scoped, name+photo
entity a [Character](character.md) can belong to (0 or many, via `Character.factions`, a plain
M2M with no through-model — model field only, not yet exposed by any Character serializer or UI).
No `hidden`/`description` field, no delete endpoint (Django-admin-only for superusers), no `/all.json`
or `/full.json` hidden-inclusive variants (there is no hidden concept to gate).

| Endpoint | Method | Who can call |
|----------|--------|-------------|
| `/games/<slug>/factions.json` | GET | **AllowAny** — paginated list |
| `/games/<slug>/factions/<id>.json` | GET | **AllowAny** — 404 if unknown or in another game |
| `/games/<slug>/factions.json` | POST | **Regular** (Staff + AnyPlayer) — roles per [`game_faction/endpoints.yml`](../../../backend/permissions/config/game_faction/endpoints.yml)'s `regular.create` |
| `/games/<slug>/factions/<id>/photo_upload.json` | POST | **Regular** (Staff + AnyPlayer) — [`game_faction/endpoints.yml`](../../../backend/permissions/config/game_faction/endpoints.yml)'s `regular.photo_upload`; requires authentication ( `IsAuthenticated`) in addition to the role check |
| `/games/<slug>/factions/<id>.json` | PATCH | **Regular** (Staff + AnyPlayer) — roles per [`game_faction/endpoints.yml`](../../../backend/permissions/config/game_faction/endpoints.yml)'s `regular.edit` |

Create, photo-upload, and update all use the broader `regular` (staff + any player) tier — a
deliberate deviation from `GameItem`'s own create (`GameItemCreatePermission`, `is_staff or
game.can_be_edited_by(user)`), decided during planning of issue #812. Update (PATCH) originally
followed `GameItem`'s plain-**GameEdit** pattern, but issue #1097 aligned it with create/
photo-upload's `regular` tier via `EndpointPermission(request.user,
game=game).check(request, 'game_faction', 'regular', 'edit')` — the dm/admin/superuser shortcut
still applies via `EndpointPermission`.

## Fields

List/detail/create-response/update-response (all reuse `FactionListSerializer` — no separate
detail serializer, since detail exposes nothing beyond the list shape): `id`, `name`,
`photo_path` — see [Photo path fields](common-rules.md#photo-path-fields).

**Write fields:**
- Create (`POST /games/<slug>/factions.json`): `name` (required, ≤200 chars, must be unique
  within the game — a duplicate name returns `400` with code `faction_name_taken` rather than
  leaking an `IntegrityError`).
- Update (`PATCH /games/<slug>/factions/<id>.json`, via `FactionUpdateSerializer`): `name` only
  (`required: False` governs PATCH's partial semantics; the same per-game uniqueness check
  applies). `game`/`id` are not writable fields — sending them in the payload has no effect.

## Faction creation / photo-upload permission

Both `create` and `photo_upload` are checked inline via `EndpointPermission(request.user,
game=game).check(request, 'game_faction', 'regular', <action>)` against
[`game_faction/endpoints.yml`](../../../backend/permissions/config/game_faction/endpoints.yml) —
there is no dedicated permission class (unlike `GameItemCreatePermission`). A `can_create_faction`
boolean (same `regular` roles) is also exposed on [Game](game.md)'s `permissions.json`, via
[`pages/game.yml`](../../../backend/permissions/config/pages/game.yml)'s `create_faction` entry
and [`game/ui.yml`](../../../backend/permissions/config/game/ui.yml)'s matching `create_faction`
role list.

## Photo upload

Follows the same fixed, deterministic single-photo path convention as
[GameItem](game-item.md)'s photo upload — see [Upload](upload.md) — at
`games/<slug>/factions/<id>/photo<ext>` (`use_uuid=False`, always replaces any existing
`FactionPhoto`).
