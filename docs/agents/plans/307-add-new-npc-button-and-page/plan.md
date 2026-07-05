# Plan: Add new NPC button and page

Issue: [307-add-new-npc-button-and-page.md](../issues/307-add-new-npc-button-and-page.md)

## Overview

Add an in-app way for DMs/admins to create a new NPC. This requires a new backend `POST`
endpoint on the existing `game_npcs` view that creates a `Character` with `npc=True`, a new
frontend "New NPC" page (`/#/games/:game_slug/npcs/new`) reachable from a "New NPC" button
that only appears for users who can edit the game, and new translation keys for the button
and the new page's form.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

**Endpoint:** `POST /games/<game_slug>/npcs.json` (added to the existing `game_npcs` view/URL,
same pattern as `game_sessions_list.py`'s `POST` support).

- **Auth:** Enforced inline via `GameEditPermission.check(request, game)` (not DRF
  `permission_classes`) — same pattern already used by `game_npcs_all.py` and
  `game_session_create` for game-level edit checks. Returns `401` (unauthenticated) or `403`
  (authenticated but not allowed) before validation, with body
  `{"errors": {"detail": ["authentication required"]}}` or `{"errors": {"detail": ["not allowed"]}}`.
- **Request body (JSON):**
  - `name` (string, **required**)
  - `role` (string, optional)
  - `public_description` (string, optional)
  - `private_description` (string, optional)
  - `hidden` (boolean, optional, defaults to the model default — `False`, per
    `Character.hidden`'s model field default)
  - `money` (integer, optional)
  - `player` is intentionally **not** accepted — NPCs have no player.
- **Success response:** `201 Created`, body is `CharacterDetailSerializer` output for the
  created character (`id`, `name`, `role`, `public_description`, `is_pc`, `photos`, `links`,
  `game_slug`, `can_edit`, `profile_photo_path`, `profile_photo_id`, `money`). `npc` is always
  forced to `True` and `game` to the game resolved from `game_slug` — both are set
  server-side and are not accepted from the request body.
- **Validation failure:** `400`, body `{"errors": {"<field>": ["<message>", ...]}}` (same shape
  produced by `validated_or_error`, e.g. `{"errors": {"name": ["This field is required."]}}`).
- **Frontend access-gating:** the "New NPC" button and the new page both gate on
  `GameClient.fetchGameAccess(gameSlug, token).can_edit` (already existing endpoint/contract,
  no changes needed) — same pattern as `GameSessionsController`/`GameSessionNewController`.
  This is a client-side UX nicety only; the backend enforces the real authorization via
  `GameEditPermission` regardless of what the client sends.

**i18n:** frontend code references two new namespaces that the translator agent must add to
*both* `en.yaml` and `pt.yaml`:
- `game_npcs_page.new_npc` — label for the "New NPC" button (frontend currently has no
  `game_npcs_page` namespace at all; the NPC index page will start using one instead of the
  hardcoded title string it passes today)
- `game_npc_new_page.*` — `title`, `name_label`, `role_label`, `description_label`,
  `private_description_label`, `hidden_label`, `money_label`, `submit`, `error` (mirrors
  `game_session_new_page.*` plus the NPC-specific fields already named in `npc_edit_page.*`)

## Notes

- `data-access` and `security` review is required after `backend` finishes, since this adds a
  new endpoint (`POST`) and new user input handling — dispatch both before opening the PR.
- No `infra`/Navi change is needed: Navi only warms `GET` endpoints, and this issue adds a
  `POST` handler to an already-warmed `GET` route.
