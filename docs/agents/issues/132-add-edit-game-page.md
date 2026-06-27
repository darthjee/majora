# Add Edit Game Page

## Context

There is currently no way to edit a game's properties once it has been created. The game detail page is read-only. DMs and superusers have no UI or API endpoint to update `name`, `photo`, or `description` on an existing game. This feature is needed to let DMs manage game metadata without developer intervention, consistent with the existing character and NPC edit pages.

## What needs to be done

**Backend:**
- Add `can_be_edited_by(user)` to the `Game` model — returns `True` for superusers and any game master of that game.
- Add `GameEditPermission` to `source/games/permissions.py` mirroring `CharacterEditPermission`.
- Create `source/games/serializers/game_update.py` (`GameUpdateSerializer`) exposing `name`, `photo`, `description` with all fields optional; `game_slug` is excluded.
- Upgrade the `game_detail` view to handle `PATCH` using `GameUpdateSerializer` and `GameEditPermission`. Return 401 if unauthenticated, 403 if unauthorized.
- Add a `game_access` view at `GET /games/<game_slug>/access.json` that always returns `{can_edit: bool}` — no 401/404; returns `{can_edit: false}` for unauthenticated users and for non-existent slugs.
- Verify and align character access endpoints (`game_pc_access`, `game_npc_access`) to the same always-200 `{can_edit: bool}` contract.
- Register the new URL patterns in `source/games/urls.py`.

**Frontend:**
- Add `gameEdit` route for `/games/:game_slug/edit` in `HashRouteResolver.js` (before the existing `/games/:game_slug` entry).
- Create `GameEdit.jsx` page component, `GameEditController.js`, and `GameEditHelper.jsx` mirroring the PC/NPC edit page structure.
- Add `updateGame(gameSlug, payload)` and `fetchGameAccess(gameSlug)` methods to `GameClient.js`.
- Update `GameController` to fetch `/access.json` and overlay `can_edit` onto the game object.
- Update the game detail page to show an edit link when `game.can_edit` is true. Non-editors navigating directly to `/games/:game_slug/edit` are redirected to the game detail page.
- Add `game_edit_page:` translation keys to `frontend/assets/i18n/en.yaml` and `pt.yaml`.

## Acceptance criteria

- [ ] `PATCH /games/<game_slug>.json` with valid credentials updates the game and returns the updated game object.
- [ ] `PATCH /games/<game_slug>.json` returns 401 when unauthenticated and 403 when the user is not a DM for that game or a superuser.
- [ ] `GET /games/<game_slug>/access.json` always returns 200 with `{can_edit: bool}` — never 401 or 404 — including for unauthenticated requests and non-existent slugs.
- [ ] Character access endpoints (`/pcs/<id>/access.json`, `/npcs/<id>/access.json`) also return 200 with `{can_edit: bool}` under all authentication states.
- [ ] Navigating to `/games/:game_slug/edit` as an authorized DM renders the game edit form with fields for `name`, `photo`, and `description`.
- [ ] Submitting the form with valid data saves the game and redirects to the game detail page.
- [ ] Non-editors navigating to `/games/:game_slug/edit` are redirected to the game detail page.
- [ ] The game detail page shows an edit link/button only when `can_edit` is `true`.
- [ ] Translation keys for the game edit page exist in both `en.yaml` and `pt.yaml` with no missing or extra keys relative to each other.
