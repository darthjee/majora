# Issue: Move npc update to `PATCH full.json`

## Description
On the NPC pages (`/#/games/:game_slug/npcs`, `/#/games/:game_slug/npcs/:id`, and `/#/games/:game_slug/npcs/:id/edit`), every update (editing NPC fields, and toggling `slain`/`public_slain`) is sent as `PATCH /games/:game_slug/npcs/:id.json`. The PC edit page follows the same pattern via `PATCH /games/:game_slug/pcs/:id.json`.

A `GET /games/:game_slug/npcs/:id/full.json` endpoint already exists (mirrored for PCs as `GET /games/:game_slug/pcs/:id/full.json`) and returns the same detail plus `private_description`, gated by `CharacterEditPermission` (GM-only today). It currently only supports `GET`.

## Problem
We want to eventually let players perform limited updates to characters they interact with. To do that safely, the plain detail endpoints (`PATCH /games/:game_slug/npcs/:id.json` and `PATCH /games/:game_slug/pcs/:id.json`) need to be freed up for a future, more restrictive player-facing update, while the current GM-only full update moves to the `full.json` endpoints that are already permission-gated the same way.

## Expected Behavior
- `PATCH /games/:game_slug/npcs/:id/full.json` and `PATCH /games/:game_slug/pcs/:id/full.json` accept the same payload the current update endpoints accept (all `CharacterUpdateSerializer` fields, including `slain`/`public_slain`), enforce the same `CharacterEditPermission` check, and return the same full detail (including `private_description`) as their `GET`.
- `PATCH /games/:game_slug/npcs/:id.json` and `PATCH /games/:game_slug/pcs/:id.json` no longer perform updates (only `GET` remains on both).
- The frontend NPC and PC edit forms, and the NPC slain/public_slain toggle (index and show pages), submit to `full.json` instead.

## Solution
- Backend: add `PATCH` to `game_npc_full`/`game_pc_full` (`character_full` in `source/games/views/characters/_full.py`), reusing `CharacterUpdateSerializer` for validation/save and `CharacterFullSerializer` for the response, following the same `detail_or_update` pattern used today in `_detail.py`. Remove `PATCH` from `game_npc_detail`/`game_pc_detail` (`character_detail`).
- Frontend: point `CharacterClient` update calls (`BaseCharacterEditController` submit, `SlainConfirmController` via `setNpcSlain`) at `full.json` instead of `.json`, for both `pcs` and `npcs`.
- Update `docs/agents/access-control.md` to reflect the moved endpoints.

## Benefits
Frees the plain detail endpoints so a future, more restrictive player-facing update can be introduced there without touching the GM-only full-update path.

---

Tags: :shipit:
