# Issue: Fix revive and slain buttons

## Description
On the NPC list page (`/#/games/:game_slug/npcs`) and the NPC show page (`/#/games/:game_slug/npcs/:id`), the character photo shows an upload-photo button on the left (this part is correct) and, on the right, up to two state-toggle buttons: one pair reflecting the real `slain` state, one pair reflecting the `public_slain` state. Only one button per pair should be visible at a time, chosen by the corresponding field's current value.

## Problem
The buttons shown do not reliably match the character's actual `slain`/`public_slain` state, on both the list page and the show page.

Root cause confirmed on the NPC show page: `CharacterController#loadCharacter` (`frontend/assets/js/components/pages/controllers/CharacterController.js`) first loads the character through the public `CharacterDetailSerializer` (`source/games/serializers/character_detail.py`), which aliases `slain` to the real `public_slain` value and never exposes `public_slain` at all. When the user can edit, it then fetches the DM-only `CharacterFullSerializer` (which has the correct `slain` and `public_slain`), but `mergePrivateDescription()` only copies `private_description` out of that response into page state — `slain` and `public_slain` are discarded. As a result the "real" revive/slain button ends up driven by the public slain state, and the "public" revive/slain button is stuck reflecting "not publicly slain" regardless of the actual value.

The list page's data loading (`GameNpcsController`) replaces the whole NPC array with the full DM data wholesale rather than partially merging fields, so the same narrow bug wasn't found there on inspection — but the wrong-button symptom has also been observed there, so the same class of incomplete/unreliable full-data merging should be re-checked across that code path during implementation.

This is scoped to fixing which button is shown in which state — not a translation fix, and not a backend fix (the backend already returns the correct data; the frontend fails to use all of it).

## Expected Behavior
- `bi-heart-fill` : `revive_button` : "Revive" — shown only when `slain: true`; opens the `revive_title` : "Revive Character" confirmation modal.
- `bi-skull-fill` : `slain_button` : "Mark as Slain" — shown only when `slain: false`; opens the `slain_title` : "Mark as Slain" confirmation modal.
- `bi-heart` : `public_revive_button` : "Publicly Revive" — shown only when `public_slain: true`; opens the `public_revive_title` : "Publicly Revive Character" confirmation modal.
- `bi-skull` : `public_slain_button` : "Mark as Publicly Slain" — shown only when `public_slain: false`; opens the `public_slain_title` : "Mark as Publicly Slain" confirmation modal.

This must hold consistently on both the NPC list page and the NPC show page, immediately after load and after toggling either state.

## Solution
Ensure that wherever the full/DM-only character data is loaded (single NPC show page, and NPC list page), all fields that drive button/UI state — not just the ones a given code path happens to consume today (e.g. `private_description`) — are consistently applied to what gets rendered. In particular, fix `CharacterController`'s full-response handling on the show page so `slain` and `public_slain` from the DM response are no longer discarded, and audit the list page's full-data loading for the same class of issue.

Out of scope: translation text/keys and backend serializer changes — the backend already returns correct data.

## Benefits
DMs see accurate revive/slain state for their NPCs and can trust the action buttons to reflect reality, avoiding confusing or incorrect state toggles.
