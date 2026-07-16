# Issue: Session detail response caches stale can_edit — migrate to dedicated /permissions.json endpoint

## Description
On the game session page (`/#/games/:game_slug/sessions/:id`), the DM-only "Create Pool" button (added in #551) can fail to render for a legitimate DM. The root cause: the session detail response (`/games/:game_slug/sessions/:id.json`) is HTTP-cached (`CacheControlMiddleware` sets a cacheable `Cache-Control` header, with no `X-Skip-Cache` opt-out for this view), yet it embeds a per-user computed `can_edit` field (`GameSessionDetailSerializer.get_can_edit`). A cached response computed for one requester can be served to a different one, so a DM can see a stale `can_edit: false` and lose both the "Edit" and "Create Pool" buttons, which both depend on that same field.

Every other core resource (Game, PC, NPC, Treasure) has already been migrated off this pattern: each has a dedicated, never-cached `.../permissions.json` sub-endpoint (`BasePermissionsSerializer` subclasses, e.g. `GamePermissionsSerializer`) that the frontend fetches separately (`AccessStore.ensureXPermissions`/`getXPermissions`), merging the result into resource state once the (cacheable) detail fetch resolves. Session was missed in that migration — `GameSessionDetailSerializer` still embeds `can_edit` directly in the cacheable detail response.

## Problem
- `can_edit` in the session detail JSON is per-user, but the response itself is cacheable, so a cached/shared response can leak a stale permission value to a different requester.
- This most visibly hides the DM-only "Create Pool" button (and the "Edit" button) on the session page even for a legitimate DM.
- It is not session-specific — it is the same caching-vs-per-user-data problem already solved for Game/PC/NPC/Treasure via a dedicated permissions endpoint, but Session was never migrated to that pattern.

## Expected Behavior
- `/games/:game_slug/sessions/:id.json` no longer embeds `can_edit` and is safe to cache.
- A new `/games/:game_slug/sessions/:id/permissions.json` endpoint (never cached for real-identity requests, following the existing `/permissions.json` convention, with role-simulation support via the `role` query param like the Game/PC/NPC/Treasure endpoints) returns `{ can_edit: <bool> }` for the session, computed the same way `GameSessionDetailSerializer.get_can_edit` does today (`session.can_be_edited_by(user)`).
- The game session page fetches this endpoint and merges `can_edit` into session state once the cacheable detail fetch resolves (mirroring `GameController`'s `#renderGame`/`#mergeAccess` pattern), so the "Edit" and "Create Pool" buttons render correctly and consistently for DMs regardless of response caching.

## Solution
Backend:
- Add `SessionPermissionsSerializer` (subclass of `BasePermissionsSerializer`, mirroring `GamePermissionsSerializer`), delegating to `session.can_be_edited_by(user)` / the role-simulated equivalent.
- Add a `session_permissions` view (mirroring `backend/games/views/games/game_permissions.py`), using the existing `parse_role_booleans`/`permissions_response` helpers from `views/common.py`.
- Add route `games/<slug>/sessions/<id>/permissions.json` in `backend/games/urls/games.py`, next to the existing `game-session-detail` route.
- Remove `can_edit` from `GameSessionDetailSerializer`.

Frontend:
- Add `fetchSessionPermissions` to `GameSessionClient.js` (mirroring `GameClient.fetchGamePermissions`).
- Add `ensureGameSessionPermissions`/`getGameSessionPermissions` to `AccessStorePermissions`/`AccessStore` (mirroring the Game equivalents), with a fail-closed default of `{ can_edit: false }`.
- Update `GameSessionController.js` to fetch and merge session permissions after the session detail fetch resolves, mirroring `GameController`'s `#renderGame`/`#mergeAccess`.

This also fixes the originally reported symptom (missing "Create Pool" button), since button visibility no longer depends on a cacheable field.

## Benefits
- Reliably fixes the "missing Create Pool button" bug, by addressing the general staleness issue that causes it rather than only the specific report.
- Closes a caching-correctness gap that also affects the "Edit" button, preventing cross-user permission staleness caused by HTTP/proxy caching.
- Brings Session in line with the Game/PC/NPC/Treasure permissions-endpoint convention already established in the codebase.
