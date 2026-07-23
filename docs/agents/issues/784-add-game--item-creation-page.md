# Issue: Add Game Item Creation Page

## Description
There is an existing `CharacterItem` creation flow for PCs and NPCs (`/#/games/:game_slug/pcs/:id/items/new` and `/#/games/:game_slug/npcs/:id/items/new`). On submit it creates a `GameItem` and an associated `CharacterItem` in a single endpoint, then runs a deferred photo-upload step for the `GameItem`.

## Problem
There is no way to create a `GameItem` that is not owned by a PC or NPC. DMs, admins, and staff have no page to add items directly to a game without going through a character.

## Expected Behavior
- The "Create Item" link on `/#/games/:game_slug/items` is only rendered for users who can create items (dm, admin, staff); other viewers don't see it.
- Submitting the new-item form creates the `GameItem` via the new endpoint; if a photo was picked, it is then uploaded via the existing photo-upload endpoint (deferred flow, same as `CharacterItemNew`).
- After successful creation (with or without photo), the user is redirected to `/#/games/:game_slug/items` (the items list page).

## Solution
- Add a new page at `/#/games/:game_slug/items/new`, modeled after the existing `CharacterItemNew` page/flow — same `name`/`description`/`hidden` fields and deferred photo-upload flow.
- Add a "Create Item" link on `/#/games/:game_slug/items` (the `GameItems` list page, currently read-only per #658), gated client-side to dm/admin/staff.
- New endpoint `POST /games/:game_slug/items`:
  - Creates only the `GameItem` (no `CharacterItem`).
  - Accessible by dm, admin, and staff.
- Reuse the existing `POST /games/:game_slug/items/:id/photo_upload.json` endpoint for the photo step (already independent of `CharacterItem`).
