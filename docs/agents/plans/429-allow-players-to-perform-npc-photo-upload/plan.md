# Plan: Allow players to perform NPC photo upload

Issue: [429-allow-players-to-perform-npc-photo-upload.md](../issues/429-allow-players-to-perform-npc-photo-upload.md)

## Overview

Let any player of a game (not just the GM/superuser) upload an NPC's photo, on both the NPC
show page and the NPC index page, by reusing #416's `NpcPlayerEditPermission` at the two
backend permission checkpoints (upload-init, upload-finalize) and #416's `is_player`
page/character state on the frontend. PCs are completely untouched. This is purely additive —
no existing GM/superuser/owner behavior changes.

**Depends on #416**: this plan reuses `NpcPlayerEditPermission` (`source/games/permissions.py`,
introduced by #416's plan) and the `is_player` merge points #416 adds to
`CharacterController#fetchAndMergeAccess` and `GameNpcsController#fetchAccess`. Implement #416
first; do not start this plan against a pre-416 checkout.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- Backend reuses `NpcPlayerEditPermission` (from #416) at two existing checkpoints, NPC-only:
  - `source/games/views/characters/_photo_upload.py` (`character_photo_upload`, currently
    always `CharacterEditPermission.check`) — use `NpcPlayerEditPermission` when `npc` is
    `True`, keep `CharacterEditPermission` when `npc` is `False` (PC, unchanged).
  - `source/games/views/upload_finalize.py` (`_check_permission`) — when the upload's
    `content_object` is a `CharacterPhoto` whose `character.npc` is `True`, use
    `NpcPlayerEditPermission` instead of `CharacterEditPermission`; PC photos keep
    `CharacterEditPermission` unchanged.
  - No response-shape change: both endpoints keep returning exactly what they return today on
    success; only who is let through changes.
- Frontend must **not** conflate "may upload an NPC's photo" with "may edit the NPC" (the
  broader `can_edit`/`canEdit` used for the DM edit button, the "New NPC" button, and the
  slain/revive buttons). A player of the game gets ONLY the upload capability, not those other
  NPC edit rights. Concretely: the upload-button gate becomes
  `can_edit || (is_pc === false && is_player)`, computed and passed as its own value —
  distinct from the `can_edit`/`canEdit` value still used, unchanged, to gate the DM edit
  button, the "New NPC" button, and the slain/revive button set.
