# Issue: Add Character Hidden Description

## Problem
Right now, a character has only one `description` field, and it is fully public. The DM needs a place to keep private notes/details about a character that should not be visible to other players, while everyone should still be able to see a public description.

## Expected Behavior
- The character's existing `description` becomes `public_description`, visible to everyone (as today).
- A new `private_description` field holds DM-only/owner-only notes, never returned by the regular list/detail serializers.
- A new `/full` endpoint returns both `public_description` and `private_description`, but only to users who already have edit access to the character:
  - For PCs: the DM(s) of the game and the character's own player.
  - For NPCs: the DM(s) of the game only.
  - Superusers always have full access, as with every other permission in the app.
- `private_description` is also editable through the existing PATCH endpoint, under the same access rule above (PC: DM or owner; NPC: DM only).

## Solution
- Rename the `Character.description` field to `public_description` via a Django migration that preserves existing values.
- Add a new `Character.private_description` field (blank by default).
- Add `CharacterFullSerializer` exposing `public_description` and `private_description`, reusing the existing `can_be_edited_by()`/editors permission check (already differentiates PC owner vs DM-only for NPCs) to gate access.
- Add new endpoints:
  - `GET /games/:game_slug/pcs/:id/full`
  - `GET /games/:game_slug/npcs/:id/full`
- Add `private_description` to `CharacterUpdateSerializer` so it can be set via the existing PATCH endpoint, under the same permission rule.
