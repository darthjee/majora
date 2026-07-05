# Issue: Add NPC slain

## Description
Add a "slain" flag to NPC characters. When an NPC is marked as slain, its photo is shown in grayscale everywhere except on the character's own photo gallery page. Admins and DMs can toggle a character between slain and alive ("Revive") via an overlay button on the character photo, with a confirmation modal.

## Problem
There is currently no way to track or visually indicate that an NPC has died during the game. DMs have no in-app way to mark this, and players have no visual cue distinguishing living NPCs from dead ones.

## Expected Behavior
- A `slain` boolean flag exists on the `Character` model (shared by PCs and NPCs), but only NPC pages expose UI to toggle it — PCs never get a slain/revive button.
- When `slain` is true, the character's photo is rendered in grayscale (shades of gray) in every place its profile photo appears (e.g. NPC index cards, NPC show page, and any other component rendering the character's profile photo), **except** on the character's own photo gallery/list page, where photos are always shown in full color.
- On the NPC index page (`/#/games/:game_slug/npcs`), each NPC card gets a photo-overlay "Upload Photo" button (left side) — consistent with the NPC show page — and, for users allowed to edit the character, a "Slain"/"Revive" overlay button (right side, red for Slain / green for Revive).
- On the NPC show page (`/#/games/:game_slug/npcs/:id`), the existing "Upload Photo" overlay button is moved to the left side of the photo, and a "Slain"/"Revive" overlay button is added to the right side, visible only to users allowed to edit the character.
- The permission gating the Slain/Revive button reuses the existing character edit-permission check (`Character.can_be_edited_by`): superuser, the game's DM, or the character's own linked player — same check already used for photo upload/edit.
- Clicking the Slain/Revive button opens a confirmation modal (generic confirm/cancel, consistent with the existing photo-upload modal style); confirming toggles the `slain` flag.

## Solution
- Backend: add a `slain` boolean field to `Character`, plus a permission-checked action endpoint (following the existing `character_photo_set`/`CharacterEditPermission` pattern) to toggle it.
- Frontend: add the "Upload Photo" overlay to `CharacterCard` on the NPC index page; reposition overlay buttons (upload left, slain/revive right) on both the NPC index cards and the NPC show page; apply a grayscale CSS filter to the character's profile photo wherever it's rendered when `slain` is true, excluding the photo gallery page; add a confirmation modal reused/adapted from the existing `PhotoUploadModal` pattern.

## Benefits
- Lets DMs track and communicate NPC deaths directly in the game view.
- Gives players an immediate, consistent visual cue about which NPCs are alive.

---

Tags: :shipit:
