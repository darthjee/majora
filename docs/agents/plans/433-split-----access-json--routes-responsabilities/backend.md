# Backend Plan: Split `access.json` routes responsibilities

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md)'s "Shared contracts" section for the full endpoint list, response
shapes, `role` parameter semantics, and cache-header contract. Summary of what this side
must produce:

- Four new `permissions.json` views (game, pc, npc, treasure), `AllowAny`, returning
  `{"can_edit": <bool>}`, supporting an optional `role` query param (single or repeated).
- The four existing `access.json` views/serializers shrink to drop `can_edit`.
- `X-Skip-Cache: true` on `permissions.json` only when no `role` param is present; the
  response must be cacheable (and not vary by the real requester's auth state) when a
  `role` param is present.
- `GameSessionDetailSerializer`'s and (via its edit-permission enforcement) `Task`'s
  `can_edit`-equivalent logic reuse the same shared computation introduced here.
- A small resource-kind config for page→access-check mapping, replacing the frontend's
  hardcoded `accessRouteConfig.js` `kind` values.

## Step 1 — Introduce role-simulated `can_edit` alongside each model's `can_be_edited_by`

For each of `Game`, `Character` (covers both PC and NPC), `Treasure`, `GameSession`,
`Task`, add a new **role-based** variant next to the existing, unchanged
`can_be_edited_by(user)`:

- `Game.can_be_edited_by_roles(is_superuser, is_dm)` → `is_superuser or is_dm`.
- `Character.can_be_edited_by_roles(is_superuser, is_dm, is_owner)` → `is_superuser or
  is_dm or (is_owner if self.is_pc else False)` — mirrors `Character.can_be_edited_by`'s
  three branches, but NPCs must never let `is_owner=True` flip this to `True` (NPCs have
  no ownership concept — same rule `PcAccessSerializer`/base `_get_is_owner` already
  encode for reporting).
- `Treasure.can_be_edited_by_roles(is_superuser, is_dm)` → `is_superuser or (self.game_id
  is not None and is_dm)` — preserves the existing dual-path logic in
  `TreasureAccessSerializer._get_can_edit` (issue #296): global treasures are
  superuser-only even under simulation; only a game-exclusive treasure's `dm` role
  matters.
- `GameSession.can_be_edited_by_roles(is_superuser, is_dm)` /
  `Task.can_be_edited_by_roles(is_superuser, is_dm)` → both delegate to
  `self.game.can_be_edited_by_roles(is_superuser, is_dm)`, mirroring how
  `can_be_edited_by` already delegates.

Do not change `can_be_edited_by` itself — it stays the single real-identity source of
truth used by `_EditPermission` (`source/games/permissions.py`) and the real-identity
path of `permissions.json` below. The two methods intentionally share the same rule
expressed over different inputs (a live `user` vs. three booleans); keep them next to
each other in each model file with a one-line comment cross-referencing the other.

`is_player` and `is_staff` never appear in any `can_be_edited_by_roles` signature —
per the product-owner review, they must never affect `can_edit` for any of these five
resources.

## Step 2 — Parse and validate the `role` query parameter

Add a small helper (e.g. `source/games/views/common.py`, alongside the existing
`access_response` helper) that reads `request.query_params.getlist('role')` (handles
both `?role=dm` and repeated `?role=dm&role=player`), and reduces it to three booleans:
`is_superuser`, `is_dm`, `is_owner` (drop/ignore `player`, `staff`, and any unrecognized
value — same tolerant convention as `?allegiance=`/`?slain=`). Return `None` when the
list is empty, signaling "use the real requester's identity instead."

## Step 3 — Split the serializer hierarchy: identity vs. permissions

- `source/games/serializers/base_access.py` (`BaseAccessSerializer`): drop `can_edit` and
  `_get_can_edit` from `to_representation`/the abstract contract — it now only reports
  identity (`username`, `is_superuser`, `is_staff`, `is_dm`, `is_player`, `is_owner`).
  Keep its existing `_game_for_dm`/`_game_for_player`/`_get_is_owner` hook pattern as-is;
  `game_access.py`/`character_access.py`/`pc_access.py`/`treasure_access.py` keep
  overriding those hooks exactly as today, just without `_get_can_edit`.
- New `source/games/serializers/base_permissions.py` (`BasePermissionsSerializer`):
  `to_representation(obj)` returns `{'can_edit': self._get_can_edit(obj)}`. When the
  view's context carries parsed `role` booleans (see Step 2), calls the resource's
  `can_be_edited_by_roles(...)`; otherwise calls `obj.can_be_edited_by(self._user())`
  exactly like today. Each resource needs a thin subclass (`GamePermissionsSerializer`,
  `CharacterPermissionsSerializer` used for both PC/NPC, `PcPermissionsSerializer` if PC
  needs its own `is_owner` resolution parity with `PcAccessSerializer`,
  `TreasurePermissionsSerializer`) whose only job is picking the right
  `can_be_edited_by_roles(...)` call for that resource type.

## Step 4 — Add the four new views + cache-header handling

Mirror the existing `access.json` views' location and lookup pattern exactly (see
`views-organization.md`'s "Adoption status" — new files stay in the same flat folders as
their `*_access.py` siblings until a future migration issue):

- `source/games/views/games/game_permissions.py`
- `source/games/views/characters/game_pc_permissions.py`
- `source/games/views/characters/game_npc_permissions.py`
- `source/games/views/treasures/treasure_permissions.py`

Register each in the matching `__init__.py` and in `source/games/urls.py`, next to the
corresponding `*_access.py` entry, named e.g. `game-permissions`, `game-pc-permissions`,
`game-npc-permissions`, `treasure-permissions`.

Add a `permissions_response(serializer_cls, obj, request, role_booleans, context_extra=None)`
helper next to `access_response` in `views/common.py`:
- Builds the serializer with `context={'request': request, 'roles': role_booleans, **(context_extra or {})}`.
- If `role_booleans` is `None` (no `role` param given): set `X-Skip-Cache: true`, same as
  `access_response`.
- If `role_booleans` is not `None`: do **not** set `X-Skip-Cache`. Instead, force a
  publicly-cacheable `Cache-Control` regardless of the real requester's own
  authentication state — `CacheControlMiddleware` (`source/games/middleware.py`)
  currently branches purely on `request.user.is_authenticated` (private vs public
  max-age), which would wrongly mark a role-simulated (identity-independent) response as
  private when the actual caller happens to be logged in. Add a way for a view to opt a
  response into the anonymous/public cache tier explicitly regardless of the real
  requester's auth state (e.g. a dedicated response header the middleware checks first,
  before its normal authenticated/anonymous branch) — keep this mechanism generic enough
  to reuse if a future endpoint needs the same "cacheable regardless of caller identity"
  behavior.

## Step 5 — Migrate `GameSessionDetailSerializer` and `Task` enforcement onto the shared rule

- `GameSessionDetailSerializer.get_can_edit` (`source/games/serializers/game_session_detail.py`)
  currently duplicates `obj.can_be_edited_by(user)` inline — this already calls the
  single source of truth, so no behavior change is needed here beyond confirming it still
  does (no separate `permissions.json` exists for sessions/tasks per this issue's scope,
  per the discuss-issue conversation — only the shared computation moves, not new
  endpoints).
- `TaskEditPermission` (`source/games/permissions.py`) already delegates to
  `Task.can_be_edited_by`, which now has a role-based sibling from Step 1 for
  consistency/future reuse, even though no view currently needs the role-simulated path
  for tasks.
- No new `permissions.json`/`access.json` routes are added for `GameSession`/`Task` in
  this issue — only their internal `can_edit`/`can_be_edited_by_roles` computation is
  unified with the shared per-resource rule from Step 1.

## Step 6 — Resource-kind config endpoint replacing `accessRouteConfig.js`'s hardcoded kinds

Add a small, static (non-paginated, publicly cacheable, no auth dependency) endpoint —
e.g. `GET /access-route-config.json` — returning a JSON object keyed by the same page
identifiers the frontend already uses (`game`, `gameEdit`, `pcCharacter`, `treasureEdit`,
`staffUsers`, ...), each value being the resource **kind** only (`game`, `character`,
`treasure`, `superuser`, `staffOrSuperuser`, plus `characterKind` for `pcs`/`npcs` where
applicable) — no URL patterns (those stay frontend-owned, see frontend.md). Source this
from a plain Python dict in the backend (e.g.
`source/games/access_route_config.py`), so it's the single place both a future internal
consumer and this endpoint read from. `AllowAny`, cacheable (no per-user variance at
all — always the anonymous cache tier).

## Files to Change

- `source/games/models/game.py` — add `can_be_edited_by_roles`
- `source/games/models/character.py` — add `can_be_edited_by_roles`
- `source/games/models/treasure.py` — add `can_be_edited_by_roles`
- `source/games/models/game_session.py` — add `can_be_edited_by_roles`
- `source/games/models/task.py` — add `can_be_edited_by_roles`
- `source/games/serializers/base_access.py` — drop `can_edit`/`_get_can_edit`
- `source/games/serializers/game_access.py`, `character_access.py`, `pc_access.py`,
  `treasure_access.py` — drop `_get_can_edit` overrides
- `source/games/serializers/base_permissions.py` — new
- `source/games/serializers/game_permissions.py`, `character_permissions.py`,
  `pc_permissions.py`, `treasure_permissions.py` — new
- `source/games/serializers/__init__.py` — export the new permissions serializers
- `source/games/views/common.py` — add role-param parsing helper + `permissions_response`
- `source/games/views/games/game_permissions.py` — new view
- `source/games/views/characters/game_pc_permissions.py`,
  `game_npc_permissions.py` — new views
- `source/games/views/treasures/treasure_permissions.py` — new view
- `source/games/views/games/__init__.py`, `views/characters/__init__.py`,
  `views/treasures/__init__.py` — export new views
- `source/games/urls.py` — register four new routes + the resource-kind config route
- `source/games/middleware.py` — support opting a response into the public cache tier
  regardless of the real requester's auth state
- `source/games/access_route_config.py` — new, backs the config endpoint
- `source/games/views/access_route_config.py` (or similar) — new view for Step 6
- `source/games/tests/...` — new/updated tests (see Step 7)

## Step 7 — Tests

- Model tests: `can_be_edited_by_roles` for each of the five models, covering every
  documented no-op (`owner` on Game/Treasure/NPC/GameSession/Task never flips `can_edit`;
  `player`/`staff` never appear in the signature at all) and every real branch (dm,
  superuser, and PC owner).
- View tests for each new `permissions.json` endpoint: real-identity path (same
  assertions as the existing `access.json` `can_edit` tests, now against
  `permissions.json`), role-simulated path (per recognized role and combinations),
  unrecognized role values ignored, `X-Skip-Cache` present only without `role`.
- Update existing `access.json` view/serializer tests to assert `can_edit` is no longer
  present in the response.
- Test for the cache-tier override added in Step 4 (role-based `permissions.json`
  response is publicly cacheable even when requested by an authenticated user).
- Test for the new resource-kind config endpoint's shape and cacheability.

## CI Checks

- `source/`: `docker-compose run --rm backend poetry run pytest games/tests/views/`
  (CI job: `pytest_views`)
- `source/`: `docker-compose run --rm backend poetry run pytest --ignore=games/tests/views/`
  (CI job: `pytest_all`)

## Notes

- Update `docs/agents/access-control.md` in the same PR — new endpoints, the `role`
  parameter's per-resource meaning/no-ops, and the shrunk `access.json` shape all need
  documenting there per that file's own header instruction.
- `data-access` and `security` review should be invoked once this is implemented — see
  plan.md's "Notes" section for what to focus on.
- Coordinate the exact shape/name of the Step 6 resource-kind config endpoint with the
  frontend agent before finalizing — it's the one new cross-cutting piece not dictated
  by the issue's own examples.
