# Plan: Player should be able to edit NPC

Issue: [578-player-should-be-able-to-edit-npc.md](../issues/578-player-should-be-able-to-edit-npc.md)

## Overview

Players currently cannot see the Edit button on an NPC's show page, even though the backend
already lets any player of the game PATCH the narrow, player-facing NPC endpoint. A prior
issue (#445, "Allow Npc Edit") already built most of the plumbing for this "general edit"
tier — the `is_player` flag already keeps players on the edit page and routes their submit to
the player endpoint. This issue closes the two remaining gaps: (1) the show-page Edit button
never checks `is_player`, so players never see it in the first place, and (2) `name`/`role` are
excluded from both the player-writable serializer and the player-editable form, per the
product decision to widen the player-editable field set to include them (but not `money`,
which stays full-editor-only). No PC changes are needed — PC access is already correctly
owner-gated end to end, and the issue's own text resolves the "does a PC partial-PATCH
endpoint need to exist" question to "no" since it doesn't exist today.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

### Partial NPC PATCH payload — backend widens, frontend sends more

`PATCH /games/:game_slug/npcs/:id.json` (`NpcPlayerUpdateSerializer`) currently accepts
`public_description`, `allegiance` (→ `public_allegiance`), `slain` (→ `public_slain`), `links`.
It gains two more writable keys, both mapped 1:1 with no aliasing (unlike `allegiance`/`slain`):

| Wire key | Model field | Type |
|---|---|---|
| `name` | `name` | string |
| `role` | `role` | string |

`money` is deliberately **not** added — it stays full-editor-only (`full.json` only), per explicit
product decision.

### No backend permissions-endpoint change

`GET /games/:game_slug/npcs/:id/permissions.json` (and the `pcs` counterpart) keep returning
exactly `{"can_edit": bool}`, unchanged. The frontend does **not** need a new flag from this
endpoint — the existing `character.is_player` (sourced from the `access.json` endpoint via
`CharacterController#mergeAccess`, `frontend/assets/js/components/resources/character/pages/controllers/CharacterController.js:156-170`)
is the general-edit signal, and is already merged onto every loaded character object today.
Backend only needs to touch the NPC player-update serializer's field set; frontend only needs
to start reading `is_player` in one more place (the Edit button) and to stop treating `name`/
`role` as full-editor-only in the NPC edit form.
