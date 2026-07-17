# Plan: Allow players and staff to upload PC photos

Issue: [619-allow-players-and-staff-to-upload-pcs-photos.md](../../issues/619-allow-players-and-staff-to-upload-pcs-photos.md)

## Overview

PC photo upload is currently gated by `CharacterEditPermission`, which only allows the game's
superuser, DM, and the PC's own assigned player (its "owner"). Superuser, DM, and owner are
already covered — the real gap is Django `is_staff` users (globally) and any other player of
the game (not just the PC's own owner). We introduce a new, narrower permission class for the
PC photo-upload action only (mirroring the existing `NpcPlayerEditPermission` pattern already
used for NPC photo uploads), leaving full PC editing (`CharacterEditPermission`) untouched.
Frontend gating for the upload button/modal is updated to match on the character detail page
and the PC photos listing page.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- Endpoint behavior: `POST /games/:game_slug/pcs/:id/photo_upload.json` now returns `201`
  (not `403`) for: any authenticated player of the character's game (`Player.games`
  membership, regardless of whether they own this specific PC), and any user with
  `is_staff=True` (global, not scoped to this game). Response shape is unchanged
  (`{upload_id, token, character_id}`).
- No new/renamed response fields are introduced. The frontend must derive upload
  eligibility client-side from existing access fields already returned by
  `/games/:game_slug/pcs/:id/access.json` (`is_player`, `is_staff`) combined with the
  existing `/permissions.json`-derived `can_edit` — the same pattern
  `CharacterAvatarHelper.jsx` already uses for NPCs. No backend serializer changes are
  needed for this contract.
- `is_staff`-based upload eligibility is PC-specific for this issue — it must not be
  applied to NPC photo upload (`NpcPlayerEditPermission` stays as-is).
