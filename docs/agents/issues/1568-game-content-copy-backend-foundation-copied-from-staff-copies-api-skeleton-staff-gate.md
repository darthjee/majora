# Issue: Game content copy: backend foundation (copied_from, staff/copies API skeleton, staff gate)

## Description
First implementation issue of "copy content between games" (epic #1550). It is the backend foundation every other copy issue builds on. Staff and superusers will copy game-scoped content (items, common items, recipes, documents, factions, possessions) from one game to another.

Design source of truth: the specs under `docs/agents/specs/game-content-copy/` (index `docs/agents/specs/game-content-copy.md`) and `docs/agents/access-control/staff-copy.md`. If this issue and the specs disagree, the specs win. Implements `copy-flow.md` (the model and generic API parts) and `permissions.md`.

## Problem
The copy feature is split across several issues: uploads (#1569), proxy (#1570), page (#1571) and one issue per tab (#1572–#1577). They all need a shared base to build on: the `copied_from` provenance FK, the staff-only `staff/copies*` endpoints with their staff gate and `X-Skip-Cache`, and a way for each tab to plug its content type in. Without that base, each tab would have to re-implement the gate, validation and routing on its own.

## Expected Behavior

### Model
- Nullable, self-referencing `copied_from` FK (`on_delete=SET_NULL`) on `GameItem`, `GameCommonItem`, `GameRecipe`, `GameDocument`, `GameFaction` and `GamePossession`. It is added through an additive `games` migration plus the matching `versioning` migration (all six models use `HistoricalRecords(app='versioning')`). It is not registered in Django admin.
- `copied_from` is never exposed by regular or restricted game serializers.

### Endpoints
All are `.json`, staff/superuser only, and send `X-Skip-Cache: true` on every response:
- `GET staff/copies.json`: the tab index, `{types: [<slug>, ...]}` in tab order (like `staff/photos.json`). It returns `{types: []}` until the tab issues register their types.
- `GET staff/copies/games.json`: every game across all domains, as `[{slug, name, domain_groups}]` (group names only), ordered by name and not paginated. A game without a domain group is listed with `domain_groups: []`.
- `GET staff/copies/<type>.json?from=&to=`: generic dispatch to the registered type's list.
- `POST staff/copies/<type>/<id>.json` `{target}`: generic dispatch to the registered type's copy.

### Dispatch check order
1. `require_staff`: `401` for anonymous callers, `403` (`{errors: {detail: ['not_allowed']}}`) for everyone else who isn't staff or superuser, including DMs and game admins. Nothing else is resolved before this, so the endpoints are not an existence oracle.
2. `<type>` resolved through the registry: `404` if unknown.
3. Request parameters, `400`:
   - list: `from`/`to` missing, unknown, or the same game;
   - POST: `target` missing, not a string, empty, an unknown slug, or malformed JSON.
4. POST only: the source `<id>` looked up through the registered model, `404` if missing.
5. POST only: `target` is the source entity's own game, `400`. This needs the loaded source, so it comes after step 4. The POST has no `from`; the source game always comes from the entity.
6. Hand-off to the registered type, which receives the resolved games and, for POST, the source row.

A malformed request is `400` whether or not `<id>` exists; only the same-game check depends on the entity existing.

### Edge cases
- Wrong HTTP method: `405` from `@api_view`, still carrying `X-Skip-Cache` because `@restricted` is outermost.
- Non-numeric `<id>`: it doesn't match the `<int:...>` URL, so Django returns its own `404` without `X-Skip-Cache`. This is accepted: it matches the existing `staff/photos` endpoints and the response holds no data.
- `games` and `links` (#1569) are reserved paths under `staff/copies/`. Their URL patterns are declared before the generic `<str:type>.json` pattern, and no copy type may use those slugs.
- Deleting the source entity, or its game, nulls `copied_from` and the copy survives. Historical rows are untouched, and the nulling (a plain `UPDATE`, no `save` signal) creates no history entry on the copy.
- `copied_from` normally points to an entity of another game. It is the one allowed cross-game reference, so no validation may reject it. Copying a copy points it at the *immediate* source (a chain), not at the original; this is done by the tab issues.

### Permissions
- The staff check is `require_staff` (`AdminOrStaffCache.is_admin_or_staff`). There is no `EndpointPermission` / `permissions.yaml` entry.
- `games.json` deliberately ignores the domain and game-visibility filters. The dispatch applies no `hidden` or role filtering (staff see everything).
- New product rule: the Staff exception "Staff may create copies of game content in any game", added to `docs/agents/product/entities/ownership-and-roles.md` (both the named exceptions and the role table). It allows only *creating* copies; it grants no edit, delete or GameMaster rights over the source or the copy.

### Docs
- The Staff exception above.
- A `copied_from` note in the existing entity pages `game-item.md`, `game-document.md` and `game-recipe.md`. The note says it is a provenance link to the source, `SET_NULL` on delete, staff-only, and never exposed by game serializers. Entity pages for factions, common items and possessions don't exist yet; whoever creates one later adds the note.

## Solution

### Copy-type registry
- `backend/staff/copy_types.py`, mirroring the `PhotoType` idiom of `backend/staff/photo_types.py`: an ordered list of `CopyType` instances, with `find(slug)` and `slugs()`.
  - `CopyType.__init__(slug, model)`: `model` is what the dispatch uses to look up `<id>`.
  - `list(request, from_game, to_game)` returns the tab's paginated `Response`.
  - `copy(request, source, target_game)` returns the copy `Response`.
  - In this issue both methods raise `NotImplementedError`. #1572 turns them into generic methods driven by config (list serializer, copier, cache paths). The other tabs then mostly configure `CopyType`, and subclass it only for their own rules (for example, the recipes' `GameCommonItem` resolution or the factions' `422`).
- This issue ships the registry **empty**. Each tab issue inserts its entry at the position the spec's tab table gives (`items`, `common_items`, `recipes`, `documents`, `factions`, `possessions`), whatever order the tabs are merged in.
- Every `staff/copies*` view lives in this issue (index, `games.json`, list dispatch, copy dispatch). Tab issues only register a type and never write a view, so the staff gate and `X-Skip-Cache` exist in one place.
- Views use the same stack as `staff_photos_index`: `@restricted` outermost, then `@api_view`, then `@permission_classes([AllowAny])`, with `require_staff` called first in the body.

### Out of scope
- **Shared copy behavior** (one transaction, keeping `hidden`, setting `copied_from`, leaving the cover null, the `201` response envelope): built by the Items tab, #1572, as the reference implementation. This issue only dispatches.
- `Upload` copy origin, the `links` in the copy response, the pending-links list and renew: #1569.
- Proxy link handler and cross-domain `X-Cache-Clear`: #1570.
- Frontend page, `staffCopy` resource, routes and frontend gating (`ensureStaffOrSuperUser`, the `RequestPermissionResolvers.js` note): #1571.
- Per-tab list fields, `copied_to_target`, copy logic, the faction `422` and clearing characters' available lists: #1572–#1577.
- The "Planned" banner of `docs/agents/access-control/staff-copy.md`, and the "**planned**" marker on its entry in `docs/agents/access-control.md`, stay until #1558.

### Backward compatibility
- The migrations are additive with no backfill: existing rows stay null, and no provenance is guessed for content copied by hand earlier. Both migrations are reversible (`RemoveField`), and Django indexes the FK automatically.
- Cost: deleting an entity, or a whole game, runs one extra indexed query per copyable model to null the copies' `copied_from`.
- No game serializer uses `fields = '__all__'` or `exclude`, so `copied_from` can't leak by accident.
- No existing route, response shape, Navi resource or proxy rule changes, and the frontend is untouched.
- #1569 adds its own `games` migration on top of this one. If two issues ever add migrations in parallel, the later one renumbers or rebases its migration.

### Agents and reviews
- Agents: `backend`; the `product-owner` agent is consulted on the Staff exception wording.
- Reviews: `data-access` and `security` (new endpoints, staff gate, the `games.json` domain bypass); `cache` confirms no Navi resource is needed (every endpoint is `X-Skip-Cache`).

### Tests
- Staff gate: `401`/`403` on every endpoint, including with an unknown `<type>`.
- `returns_skip_cache_header` on every endpoint and status, including `405`.
- `games.json`: a game outside the request's domain is listed; a game without a domain group gets `[]`; a game in several groups lists them all; ordering is by name.
- Dispatch: unknown `<type>` gives `404`, then the `400` cases on `from`/`to`/`target`, then `404` on `<id>`, then `400` for a `target` equal to the source's game, then the hand-off. Everything after the `<type>` check is covered by registering a fake type during the test (for example, by patching the registry), since the real registry is empty.
- Migrations and `copied_from`: `SET_NULL` on deleting the source and the source game, no history entry created on the copy, and regular and restricted item responses don't contain `copied_from`.

### Depends on
Nothing. First issue of Phase 2 of #1550.

## Benefits
Gives every later copy issue (uploads, proxy, page, tabs) a stable model, a single staff-gated API skeleton, and a registry to plug into. Tabs only add their own logic.
