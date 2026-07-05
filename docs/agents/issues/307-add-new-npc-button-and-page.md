# Add new NPC button and page

## Context

The Game NPCs index page (`/#/games/:game_slug/npcs`) currently has no way to create a new NPC from the UI: there is no "New NPC" button, no creation page, and no backend endpoint to create one. NPCs can currently only be listed, viewed, and edited — not created.

DMs (and admins) have no in-app way to add a new NPC to a game. This forces creating NPCs outside the app (e.g. directly in the database or admin panel), which is inconsistent with how other game-owned resources — notably game Sessions — already support in-app creation restricted to users who can edit the game.

## What needs to be done

- On `/#/games/:game_slug/npcs`, show a "New NPC" button only to users who can edit the game (a DM of the game, or a superuser/admin) — the same `can_edit` permission already surfaced by `GameClient.fetchGameAccess` and used by the "New Session" button on the Sessions page.
- Clicking the button navigates to `/#/games/:game_slug/npcs/new`.
- Users without edit access do not see the button, and the create action is rejected server-side even if the create endpoint is called directly.
- The New NPC page shows a form with: Name (required), Role, Description (public), DM Notes/private description, Hidden flag, and Money.
- Submitting the form creates a new NPC (`Character` with `npc=True`) under the current game.
- On success, the user is redirected to the new NPC's detail page (`/#/games/:game_slug/npcs/:id`).

**Frontend**
- Mirror the existing `GameSessions` → `GameSessionNew` pattern (`GameSessionsController`'s `setCanEdit`/`fetchGameAccess`, `GameSessionsHelper`'s `NewButton`/`PageActions`):
  - Wire `canEdit`/`newHref` into `GameNpcs.jsx`. Since `GameCharactersHelper` is shared between `GamePcs.jsx` and `GameNpcs.jsx`, the "New NPC" button must only render for the NPC page — PC creation stays out of scope for this issue.
  - Add `GameNpcNew.jsx` + `GameNpcNewController.js` + `GameNpcNewHelper.jsx`, mirroring `GameSessionNew.jsx` / `GameSessionNewController.js` / `GameSessionNewHelper.jsx`, with fields for name, role, public description, private description, hidden, and money.
- Register `/games/:game_slug/npcs/new` in `HashRouteResolver.js` **before** `/games/:game_slug/npcs/:character_id` (currently registered around line 30) — otherwise the router matches "new" as a `character_id`.
- Add the needed i18n keys (button label, form labels, page title, errors) to `en.yaml` and `pt.yaml`.

**Backend**
- Add `POST` support to `game_npcs` (`source/games/views/characters/game_npcs.py`), following the `game_sessions_list.py` pattern: check `GameEditPermission` inline before creating, force `npc=True` and `game=game` on save, and return a 201 with the created NPC's detail data.
- Add a create serializer accepting `name` (required), `role`, `public_description`, `private_description`, `hidden`, and `money` — the same field set `CharacterUpdateSerializer` already exposes, but with `name` required and no `player` field (NPCs aren't assigned a player).

## Benefits

- DMs and admins can create NPCs directly from the game UI, without needing database/admin access.
- Reuses the existing `can_be_edited_by` / `GameEditPermission` access-control model, keeping permission checks consistent with Sessions and other game-owned resources.

## Acceptance criteria

- [ ] "New NPC" button shown on `/#/games/:game_slug/npcs` only to users who can edit the game
- [ ] Button navigates to `/#/games/:game_slug/npcs/new`
- [ ] New NPC page renders a form with Name (required), Role, public Description, private Description/DM Notes, Hidden flag, and Money
- [ ] Submitting the form creates a `Character` with `npc=True` under the current game
- [ ] On success, user is redirected to `/#/games/:game_slug/npcs/:id`
- [ ] `POST` to the NPC create endpoint is rejected server-side for users without edit access, even when called directly
- [ ] `/games/:game_slug/npcs/new` is registered in `HashRouteResolver.js` before `/games/:game_slug/npcs/:character_id`
- [ ] New i18n keys added to both `en.yaml` and `pt.yaml`

Tags: :shipit:
