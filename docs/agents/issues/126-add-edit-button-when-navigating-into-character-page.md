# Add edit button when navigating into character page

## Context

When a logged-in user navigates from the games page into a character page, the "edit character" button should only be visible if they actually have edit access to that character — i.e. they own the character (PC owner), they're a DM of the game, or they're a superuser. Today there's no endpoint the frontend can call to check this before deciding whether to render the button.

## What needs to be done

- **Backend:** add a `GET /games/:game_slug/pcs/:id/access.json` endpoint (and the equivalent for NPCs) that returns whether the requesting user has edit access to the character. Reuse the existing `Character.can_be_edited_by()` check (already used by the PATCH endpoints in `source/games/views/characters.py`) so the access rule stays consistent: PC owner or DM or superuser for PCs, DM or superuser only for NPCs.
- **Frontend:** on the character page, call the access endpoint for the current character and conditionally render the edit button based on the response.

## Acceptance criteria

- [ ] `GET /games/:game_slug/pcs/:id/access.json` returns access for a PC, true for the owner, any DM of the game, or a superuser, false otherwise.
- [ ] `GET /games/:game_slug/npcs/:id/access.json` returns access for an NPC, true for any DM of the game or a superuser, false otherwise.
- [ ] The character page shows the edit button only when the access check returns true.
- [ ] The character page hides the edit button for logged-out users and for users without access.

---
Tags: :construction:
