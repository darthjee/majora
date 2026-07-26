# Plan: [AUDIT] Fix Permissions - Backend Routes & Frontend Features

Issue: [864-audit--fix-permissions---backend-routes---frontend-features.md](../issues/864-audit--fix-permissions---backend-routes---frontend-features.md)

## Overview

Issue #864 is an audit; most of its checklist turned out to already be correctly implemented once
verified against the code and `docs/agents/access-control/`. This plan covers only the confirmed
real gaps (the remaining `[ ]` lines), grouped into five independent backend fixes, each with a
frontend counterpart where the UI needs to follow:

1. **Players list** (`GET /games/<slug>/players.json`) — add a Staff/Superuser bypass to
   `PlayerPermission`, intentionally reversing the #589/#695 exclusion.
2. **PC/NPC item create & update** (`POST/PATCH .../pcs|npcs/<id>/items(.json/:id.json)`) — open
   to any player of the game (currently dm/staff/owner-of-PC only).
3. **PC/NPC item photo upload asymmetry** (`POST .../pcs|npcs/<id>/items/<item_id>/photo_upload.json`)
   — broaden the PC side to any player of the game, narrow the NPC side to drop the Staff bypass.
4. **Bare item/document creation** (`POST /games/<slug>/items.json`, `POST /games/<slug>/documents.json`)
   — open to any player of the game (currently dm/staff only).
5. **Game session create/update** (`POST /games/<slug>/game-sessions.json`,
   `PATCH /games/<slug>/game-sessions/<id>.json`) — open to Staff and any player of the game
   (currently dm/superuser only, no Staff even).

NPC creation (`POST /games/<slug>/npcs.json`) and its frontend button are explicitly **not** part
of this plan — split off into issue #868, since a bare permission swap there would let a
player-created NPC set `hidden`/`private_*` fields.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- **New role boolean `is_player`**: `backend/games/views/common.py`'s `parse_role_booleans`
  currently accepts `?role=player` in the query string but silently ignores it (documented as
  "accepted but silently has no effect"). Fixes #2 and #4 below both need real role-simulation
  support for "any player of the game" (mirroring the existing `is_superuser`/`is_dm`/`is_owner`/
  `is_staff` booleans), consumed by the affected `is_allowed_for_roles` classmethods and by
  `CharacterPermissionsSerializer`/`GamePermissionsSerializer`. This is backend-only — the
  frontend never sends `?role=`; it is exercised only via the DM/admin role-simulation feature.
- **`can_create_item` / `can_create_document`** (`GamePermissionsSerializer`,
  `backend/games/serializers/games/game_permissions.py`) and **`can_create_item`**
  (`CharacterPermissionsSerializer`, `backend/games/serializers/characters/character_permissions.py`)
  are the exact fields the frontend already reads (`GameItemsController.js`, `GameDocuments.jsx`,
  `CharacterItemsHelper.jsx`) to show/hide the corresponding create/edit buttons — they are
  computed directly from the backend permission classes' `is_allowed`/`is_allowed_for_roles`, not
  duplicated client-side. Once the backend permission classes broaden (fixes #2 and #4), these
  flags update automatically; **no frontend code change is needed for those two buttons**, beyond
  verification (see [frontend.md](frontend.md)).
- **New `can_edit_session` field** on `GamePermissionsSerializer`: unlike items/documents,
  sessions have no dedicated permissions flag today — `GameSessionsController.js` and
  `GameSessionController.js` both read the game's generic `can_edit` (dm/admin/superuser) via
  `AccessStore.getGamePermissions`/`ensureGamePermissions`, merged onto the session object as
  `session.can_edit`. Broadening `GameSessionEditPermission` alone therefore has **no visible
  frontend effect** until a new, session-specific flag is added and the frontend switches the
  "New Session" button and `GameSessionHelper.jsx`'s edit-button gate from `can_edit` to this new
  field. Exact field name is a backend implementation detail exposed as-is to frontend — pick
  `can_edit_session` unless the backend agent finds a clearer existing convention.

## Side effect to flag (not separately requested, but a direct consequence)

`PlayerPermission` (fix #1) is also reused, unchanged, by `Conversation`'s
`GET /games/:game_slug/conversations.json` endpoint (`docs/agents/access-control/player.md` /
`conversation.md`, both citing #695's "do not fix this back to the default" note). Broadening
`PlayerPermission` to include Staff/Superuser will also open that endpoint to Staff/Superuser as
a direct consequence, consistent with the stated "the application's usage is changing" rationale.
Update both docs' notes together rather than leaving them contradicting the new code.

## Notes

- Two duplicate/bogus checklist lines were removed from the issue during review (see the issue's
  Description) — no code work corresponds to them.
- `CharacterItemCreatePermission` itself must **not** be modified: it is also reused unchanged by
  the item acquire/remove endpoints (issue #773), which are out of scope here. Fix #2 needs a new
  sibling permission class instead.
- `CharacterItemPhotoUploadPermission`, by contrast, is used only within the single item-photo-
  upload feature (init, finalize, and the `can_upload_item_photo` flag) — fix #3 can modify it
  in place, branching internally on `character.is_pc`, rather than introducing new classes.
