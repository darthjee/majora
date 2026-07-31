# Backend Plan: Cache permissions routes

Main plan: [plan.md](plan.md)

## Shared contracts

Produce the 5 new routes exactly as specified in [plan.md](plan.md#shared-contracts) (treasure
splits into `/permissions/treasure.json` and `/permissions/game_treasure.json` — see the plan's
Amendment paragraph), remove the 4 old ones, and make `Cache-Control` public/anonymous for the new
routes without `X-Force-Public-Cache`. Response body shape must not change.

## Context

Current per-entity views all funnel through `permissions_response`/`parse_role_booleans`
(`backend/games/views/common.py:153-190`), which builds a `roles` dict from `?role=` and always
sets `X-Force-Public-Cache: true`. `CacheControlMiddleware` (`backend/games/middleware.py`) reads
that header to force the public cache tier; without it, an authenticated caller would get the
`private` tier. Each of the 4 existing views looks up the real entity (`Game`/`Treasure`/
`Character`) and passes it into the serializer/`PermissionsBuilder`, but this lookup is inert
once a role-simulated `roles` object is supplied: `BasePermission.__init__`
(`backend/games/permissions/base.py:16-21`) stores `roles if roles is not None else Roles(...)`,
and every check afterwards (`_allowed`, `_shortcut_allows`, `_role_applies`) only touches
`self._roles`, never `self._game`/`self._user`/`self._pc`. So the entity lookup can be dropped
entirely for these 4 endpoints.

Existing views/serializers to reuse the logic of (not necessarily the exact functions — see
Step 1):
- `backend/games/views/games/game_permissions.py` (`game_permissions`), routed at
  `backend/games/urls/games.py:12-16`
- `backend/games/views/treasures/treasure_permissions.py` (`treasure_permissions`), routed at
  `backend/games/urls/treasures.py:11-15`
- `backend/games/views/game/_character_shared.py`'s `build_permissions_view(npc)` factory,
  routed via `backend/games/urls/_character_routes.py` (`'/permissions.json'` entry, expanded for
  both `pcs`/`npcs` in `build_character_urlpatterns`)
- Serializers: `GamePermissionsSerializer`, `TreasurePermissionsSerializer` (check
  `backend/games/serializers/treasures/treasure_permissions.py`),
  `CharacterPermissionsSerializer` (`backend/games/serializers/characters/character_permissions.py`)
  — all subclass `BasePermissionsSerializer` and already handle a `None`/absent object.

## Implementation Steps

### Step 1 — New routes and views

Add a new URL module, e.g. `backend/games/urls/permissions.py`, with 4 `path()` entries with no
path parameters:
- `permissions/game.json` → a `game_permissions` view
- `permissions/treasure.json` → a `treasure_permissions` view
- `permissions/game_pc.json` → a PC permissions view
- `permissions/game_npc.json` → an NPC permissions view

Each view: `@api_view(['GET'])`, `@authentication_classes([CookieTokenAuthentication])`,
`@permission_classes([AllowAny])`, calls `parse_role_booleans(request)` then
`permissions_response(<Serializer>, None, request, role_booleans)` — pass `None` as the object
since it's never read once `roles` is supplied (see Context). Reuse
`GamePermissionsSerializer`/`TreasurePermissionsSerializer`/`CharacterPermissionsSerializer`
as-is; each already returns a sensible default when its object is `None`
(e.g. `GamePermissionsSerializer.to_representation`, `backend/games/serializers/games/game_permissions.py:14-15`
— confirm the treasure/character serializers do the same before reusing this pattern for them).

For the PC/NPC pair, either add two `npc`-parameterized entries to
`build_permissions_view`/`_character_shared.py` style, or two small standalone views — match
whichever is simplest given the object is no longer looked up (the `npc`-factory pattern exists
specifically to share `game_slug`/`character_id`-based lookups, which no longer apply here).

Wire the new module into `backend/games/urls/__init__.py`'s `urlpatterns` sum.

Remove the 4 old routes and their now-unused views (`game_permissions.py`,
`treasure_permissions.py`, the `permissions` entries in `_character_routes.py` and
`build_permissions_view` in `_character_shared.py` if nothing else uses it) once the new ones are
in place and tested.

### Step 2 — Drop `X-Force-Public-Cache`, teach the middleware the new prefix

In `permissions_response` (`backend/games/views/common.py:177-190`), stop setting
`X-Force-Public-Cache`. In `CacheControlMiddleware.__call__`
(`backend/games/middleware.py:24-44`), replace the `X-Force-Public-Cache` branch with a
path-prefix check, e.g. `if request.path.startswith('/permissions/'): return
self._apply_public_cache_control(response)`, ahead of the `request.user.is_authenticated` branch.
Update the middleware's docstring (lines 6-19) to describe the new prefix-based rule instead of
the header. Confirm no other endpoint currently relies on `X-Force-Public-Cache` before deleting
the header handling entirely (grep found only the 4 permissions views using it).

### Step 3 — Tests

- Move/rewrite `backend/games/tests/views/games/game_permissions_test.py`,
  `.../treasures/treasure_permissions_test.py`,
  `.../game/pcs/detail/game_pc_permissions_test.py`,
  `.../game/npcs/detail/game_npc_permissions_test.py` to hit the new URLs, drop any assertions
  tied to entity-specific behavior (there shouldn't be any, given Context), and drop the
  `X-Force-Public-Cache` assertions.
- Update `backend/games/tests/middleware_test.py` (~line 110-130) to test the new path-prefix
  rule instead of the `X-Force-Public-Cache` header.
- Update `backend/games/tests/views/common_test.py` (~line 301-313) since
  `permissions_response` no longer sets that header.
- Add/keep a test confirming the response is identical regardless of which (if any) object would
  have been looked up — i.e. that two different game slugs produce the same
  `/permissions/game.json?role=...` response (this is the behavior the whole issue is banking on).

## Files to Change

- `backend/games/urls/permissions.py` — new, the 4 new routes
- `backend/games/urls/__init__.py` — include the new module
- `backend/games/urls/games.py` — remove the old `permissions.json` entry
- `backend/games/urls/treasures.py` — remove the old `permissions.json` entry
- `backend/games/urls/_character_routes.py` — remove the `permissions` entry from the shared
  character route builder
- `backend/games/views/games/game_permissions.py`, `.../treasures/treasure_permissions.py`,
  `.../game/_character_shared.py` — remove or repoint the old per-entity views
- `backend/games/views/common.py` — `permissions_response` stops setting `X-Force-Public-Cache`
- `backend/games/middleware.py` — `CacheControlMiddleware` switches to a `/permissions/`
  path-prefix check
- Associated test files listed in Step 3

## CI Checks

- `backend`: `docker-compose run --rm majora_tests pytest games/tests/views/` (CI job:
  `pytest_views_characters` / `pytest_views_rest`) and `docker-compose run --rm majora_tests
  pytest games/tests/middleware_test.py games/tests/views/common_test.py` (CI job: `pytest_all`)
- `backend`: `docker-compose run --rm majora_tests ruff check .` (CI job: `checks`)

## Notes

- Double-check `TreasurePermissionsSerializer`'s and `CharacterPermissionsSerializer`'s
  `to_representation` handle a `None` object the same way `GamePermissionsSerializer` does before
  passing `None` in from the new views — if either currently relies on the real object even in
  the role-simulated path (unlikely per Context, but unverified for these two), that would be a
  genuine correctness gap worth flagging back rather than papering over.
- `data-access`/`security` review agents will re-check this diff for access-control regressions
  since it touches authentication/permission logic and endpoint shape — no action needed here
  beyond being ready to address their findings.
