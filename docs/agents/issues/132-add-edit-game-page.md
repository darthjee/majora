# Issue: Add edit game page

## Description
Add a game edit page that lets the DM who owns the game (or a superuser) update the game's basic properties — name, photo URL, and description — following the same patterns as the existing character and NPC edit pages.

## Problem
There is currently no way to edit a game's properties once it has been created. The game detail page is read-only. DMs and superusers have no UI or API endpoint to update `name`, `photo`, or `description` on an existing game.

## Expected Behavior
- `PATCH /games/<game_slug>.json` accepts `{name, photo, description}` and updates the game; `game_slug` is never changed. Requires authentication as a DM for that game or a superuser (401 if unauthenticated, 403 if unauthorized).
- `GET /games/<game_slug>/access.json` always returns `{can_edit: true/false}` — never a 401 or 404; returns `{can_edit: false}` for unauthenticated requests and for non-existent slugs. Character access endpoints (`/pcs/<id>/access.json`, `/npcs/<id>/access.json`) should be verified to have the same behavior.
- A new frontend route `/games/:game_slug/edit` renders the game edit form.
- The edit form contains fields for `name`, `photo` (URL), and `description`.
- On successful save, the user is redirected to the game detail page `/games/:game_slug`.
- Non-editors who navigate directly to `/games/:game_slug/edit` are redirected back to the game detail page.
- The game detail page shows an edit link/button (visible only when `can_edit` is true), requiring the frontend to fetch `/access.json` and overlay `can_edit` onto the loaded game.

## Solution
**Backend:**
- Add `can_be_edited_by(user)` to the `Game` model — returns `True` for superusers and any game master of that game.
- Add `GameEditPermission` to `source/games/permissions.py` mirroring `CharacterEditPermission`.
- Create `source/games/serializers/game_update.py` (`GameUpdateSerializer`) exposing `name`, `photo`, `description` with all fields optional; `game_slug` is excluded.
- Upgrade the `game_detail` view to handle `PATCH` using `GameUpdateSerializer` and `GameEditPermission`.
- Add a `game_access` view at `GET /games/<game_slug>/access.json` that always returns `{can_edit: bool}` — no 401/404, returns `{can_edit: false}` for unauthenticated users and for non-existent slugs.
- Verify and align character access endpoints (`game_pc_access`, `game_npc_access`) to the same always-200 `{can_edit: bool}` contract.
- Register the new URL patterns in `source/games/urls.py`.

**Frontend:**
- Add `gameEdit` route for `/games/:game_slug/edit` in `HashRouteResolver.js` (before the existing `/games/:game_slug` entry).
- Create `GameEdit.jsx` page component, `GameEditController.js`, and `GameEditHelper.jsx` mirroring the PC/NPC edit page structure.
- Add `updateGame(gameSlug, payload)` and `fetchGameAccess(gameSlug)` methods to `GameClient.js`.
- Update `GameController` to fetch `/access.json` and overlay `can_edit` onto the game object.
- Update the game detail page to show an edit link when `game.can_edit` is true.
- Add `game_edit_page:` translation keys to `frontend/assets/i18n/en.yaml` and `pt.yaml`.

## Benefits
- DMs can update game metadata (name, photo, description) without developer intervention.
- Consistent UX with the existing character and NPC edit pages — DMs already familiar with those flows will find the game edit page intuitive.
