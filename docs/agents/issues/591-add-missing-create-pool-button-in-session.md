# Issue: Session detail response caches stale can_edit — migrate to dedicated /permissions.json endpoint

## Description
On the game session page (`/#/games/:game_slug/sessions/:id`), the DM-only "Create Pool" button (added in #551) can fail to render for a legitimate DM. The root cause: the session detail response (`/games/:game_slug/sessions/:id.json`) is HTTP-cached (`CacheControlMiddleware` sets a cacheable `Cache-Control` header, with no `X-Skip-Cache` opt-out for this view), yet it embeds a per-user computed `can_edit` field (`GameSessionDetailSerializer.get_can_edit`). A cached response computed for one requester can be served to a different one, so a DM can see a stale `can_edit: false` and lose both the "Edit" and "Create Pool" buttons, which both depend on that same field.

Every other core resource (Game, PC, NPC, Treasure) has already been migrated off this pattern: each has a dedicated, never-cached `.../permissions.json` sub-endpoint (`BasePermissionsSerializer` subclasses, e.g. `GamePermissionsSerializer`) that the frontend fetches separately (`AccessStore.ensureXPermissions`/`getXPermissions`), merging the result into resource state once the (cacheable) detail fetch resolves. Session was missed in that migration — `GameSessionDetailSerializer` still embeds `can_edit` directly in the cacheable detail response.

Notably, `GameSession.can_be_edited_by(user)` simply delegates to `self.game.can_be_edited_by(user)` — a session'\''s edit permission is always identical to its parent game'\''s, by design (there is no independent session-level ownership/edit concept). This mirrors the existing precedent for `access.json`: sessions have no dedicated `access.json` endpoint of their own, and the frontend already reuses `GET /games/:game_slug/access.json` for session-related identity checks (see `docs/agents/access-control/game-session.md`). The same reuse should apply here — no new backend endpoint is needed; the session page already knows its `game_slug` from the route and can reuse the existing `GET /games/:game_slug/permissions.json` endpoint.

## Problem
- `can_edit` in the session detail JSON is per-user, but the response itself is cacheable, so a cached/shared response can leak a stale permission value to a different requester.
- This most visibly hides the DM-only "Create Pool" button (and the "Edit" button) on the session page even for a legitimate DM.
- It is not session-specific — it is the same caching-vs-per-user-data problem already solved for Game/PC/NPC/Treasure via a dedicated permissions endpoint, but Session was never migrated to that pattern.

## Expected Behavior
- `/games/:game_slug/sessions/:id.json` no longer embeds `can_edit` and is safe to cache.
- No new backend endpoint is introduced. The game session page instead fetches the existing `GET /games/:game_slug/permissions.json` endpoint (already never-cached for real-identity requests, with role-simulation support via the `role` query param) using the `game_slug` already available from the route, since a session's `can_edit` is always identical to its game's.
- The game session page merges that result into session state once the (cacheable) session detail fetch resolves (mirroring `GameController`'s `#renderGame`/`#mergeAccess` pattern), so the "Edit" and "Create Pool" buttons render correctly and consistently for DMs regardless of response caching.

## Solution
Backend:
- Remove `can_edit` (and its `get_can_edit` method) from `GameSessionDetailSerializer` — no new serializer, view, or route needed, since the existing `GamePermissionsSerializer`/`game_permissions` endpoint already covers sessions (`GameSession.can_be_edited_by` delegates to `self.game.can_be_edited_by`).

Frontend:
- Update `GameSessionController.js` to fetch the game's permissions (reusing the existing `GameClient.fetchGamePermissions` / `AccessStore.ensureGamePermissions`/`getGamePermissions`, the same helpers `GameController` already uses) with the session's `game_slug`, and merge `can_edit` into session state once the session detail fetch resolves — mirroring `GameController`'s `#renderGame`/`#mergeAccess` pattern, with a fail-closed default of `can_edit: false`.
- `GameSessionHelper`'s button-visibility checks keep reading `session.can_edit`, now sourced from the merged permissions value instead of the (removed) detail field.

This also fixes the originally reported symptom (missing "Create Pool" button), since button visibility no longer depends on a cacheable field.

## Benefits
- Reliably fixes the "missing Create Pool button" bug, by addressing the general staleness issue that causes it rather than only the specific report.
- Closes a caching-correctness gap that also affects the "Edit" button, preventing cross-user permission staleness caused by HTTP/proxy caching.
- Brings Session in line with the Game/PC/NPC/Treasure permissions-endpoint convention already established in the codebase, while avoiding a redundant new endpoint — consistent with the existing `access.json` reuse precedent for sessions.
