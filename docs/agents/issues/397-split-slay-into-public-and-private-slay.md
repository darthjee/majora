# Issue: Split slain into public and private slain

## Description
NPCs currently expose a single `slain` boolean that is identical for the DM and for players. There is no way for the DM to mark an NPC as dead internally without players finding out, or to tell players an NPC is dead while it is in fact alive. This mirrors a split that already exists for `allegiance`/`public_allegiance`: public-facing serializers expose only `public_allegiance` (under the `allegiance` name), while DM-facing serializers and filters use the real `allegiance`.

## Problem
- The NPC model has a single `slain` field, shared by the public and DM-facing APIs and by the `PATCH /games/:game_slug/npcs/:id/slain.json` endpoint.
- DMs cannot fake or hide a kill: whatever is set on `slain` is immediately visible to players.
- The existing `allegiance`/`public_allegiance` split solves the same problem for allegiance but was never applied to `slain`.

## Solution
Split `slain` into two fields, following the `allegiance`/`public_allegiance` pattern:
- `slain`: the real value, for DM use only.
- `public_slain`: the value shown to players.

This affects, at minimum:
- NPC model + migration adding `public_slain`, backfilled from the existing `slain` value for current rows.
- NPC serializers: DM-facing serializers expose both `slain` and `public_slain` under their real names; public-facing serializers expose `public_slain` aliased to the `slain` field name (mirroring how `public_allegiance` is aliased to `allegiance` today), so the real value is never sent to players over the API.
- NPC create/edit/full serializers accept both fields.
- NPC filtering by slain status splits like allegiance filtering does: the DM-facing endpoint filters by real `slain`, the public-facing endpoint filters by `public_slain`.
- The `PATCH /games/:game_slug/npcs/:id/slain.json` endpoint accepts partial updates to `slain` and/or `public_slain`, and becomes DM-only (tightening today's broader `CharacterEditPermission`, since a non-DM should not be able to toggle either the real or the public value). Opening `public_slain` up to non-DM editors is a possible future follow-up, out of scope here.
- The NPC card/detail slay control becomes 2 buttons, visible to the DM at the bottom right of the NPC picture:
  - Real slain button: `bi-skull-fill` (mark dead) / `bi-heart-fill` (mark alive).
  - Public slain button: `bi-skull` (mark dead) / `bi-heart` (mark alive).
  - Each button PATCHes the slain endpoint, updating only its own attribute.
- Player-facing card rendering (grayscale photo, etc.) keeps consuming the `slain` field as today; since that field is now aliased to `public_slain` for players, no separate frontend change is needed there — the existing behavior automatically reflects the public value.

## Benefits
- DMs can kill or revive an NPC secretly, or announce a death that has not really happened, without exposing the real game state to players.
- Brings `slain` in line with the existing `allegiance`/`public_allegiance` convention, keeping the public/DM data split consistent across NPC attributes.
