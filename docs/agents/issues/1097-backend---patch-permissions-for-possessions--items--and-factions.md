# Issue: Backend — PATCH permissions for possessions, items, and factions

## Problem
`PATCH /games/:game_slug/possessions/:id.json`, `PATCH /games/:game_slug/items/:id.json`, and `PATCH /games/:game_slug/factions/:id.json` all gate through the shared `check_game_edit()` helper (`backend/games/views/common.py`), which hardcodes `EndpointPermission(request.user, game=game).check(request, 'game', 'restricted', 'edit')` — a game-level, admin/dm-only check. There is no resource-specific permission tier for these three PATCH endpoints, so staff and players are blocked from editing possessions, items, and factions even though they should be able to.

Part of #944 (sub-issue 1 of 3 — see #944 for the layer-split rationale; sibling sub-issues cover the documents PATCH endpoint and the frontend Edit-button visibility).

## Expected Behavior
For each of the three endpoints:
- admin and dm keep edit access, as always (via `EndpointPermission`'s built-in admin/dm shortcut)
- staff and player also gain edit access
- all other roles remain forbidden, same as today

## Solution
`game_pc_item`'s permission config already implements this exact shape (added in #864): `backend/permissions/config/game_pc_item/endpoints.yml` and `ui.yml` both define a `create_update`/`regular.create_update` tier listing `staff, player, owner` (`owner` applies there because a PC item belongs to a specific character; possessions/items/factions have no such owner concept).

- Add a new `regular.edit` tier — `[staff, player]` — to `backend/permissions/config/game_possession/endpoints.yml`, `game_item/endpoints.yml`, and `game_faction/endpoints.yml`, alongside the `create`/`photo_upload` tiers already defined there.
- Create `ui.yml` for each of the three resources (`game_possession`, `game_item`, `game_faction` — none exists yet) with the matching `edit: [staff, player]` entry, mirroring `game_pc_item/ui.yml`'s shape. Nothing currently calls `UIPermission` for these three resources, so this is forward-looking config for the frontend Edit-button work tracked in the sibling #944 sub-issue, not something exercised by this issue's own code changes.
- Switch `game_possession_detail.py`, `game_item_detail.py`, and `game_faction_detail.py`'s PATCH handling from `check_game_edit()` to `EndpointPermission(request.user, game=game).check(request, '<resource>', 'regular', 'edit')`.
- Do not touch `game_possession_detail_full.py`, `game_item_detail_full.py`, or the faction equivalent — those GET-only endpoints are intentionally DM/admin-only (they expose hidden entities) and are out of scope.
- Do not touch documents (no PATCH endpoint exists there yet — tracked in a sibling #944 sub-issue) or the frontend Edit-button visibility (tracked in another sibling #944 sub-issue).

## Benefits
- Staff and players can edit possessions, items, and factions they should have access to, matching the already-correct `create`/`photo_upload` permissions for the same resources.
- Removes an inconsistency where creating or uploading a photo for these resources is already staff/player-accessible, but editing them isn't.
- Unblocks the frontend Edit-button fix tracked in the sibling #944 sub-issue, which needs a real backend permission (not just the game-level shortcut) to key off of.
