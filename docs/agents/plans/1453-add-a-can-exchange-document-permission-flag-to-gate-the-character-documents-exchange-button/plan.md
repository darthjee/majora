# Plan: Add a can_exchange_document permission flag to gate the character Documents exchange button

Issue: [1453](../../issues/1453-add-a-can-exchange-document-permission-flag-to-gate-the-character-documents-exchange-button.md)

## Overview
Expose a new `can_exchange_document` flag on the character permissions endpoints (config-only on
the backend, mirroring `can_exchange_recipe` from #1459) and use it on the frontend to render the
character Documents "Exchange" trigger only for users who can actually call
`documents/acquire.json` / `documents/remove.json`. Access-control docs are updated alongside
the backend change.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- `GET /permissions/game_pc.json` and `GET /permissions/game_npc.json` gain a new boolean field
  `can_exchange_document`.
- Value: `true` for dm/admin (always), staff and player of the game; `false` for anonymous users,
  users outside the game, and the `?role=owner` simulation (owner is not in `regular.create`).
  Role-simulated requests (`?role=staff|player|owner`) follow the same dual path as every other
  flag on these endpoints.
- Roles must mirror `regular.create` in `game_pc_document/endpoints.yml` /
  `game_npc_document/endpoints.yml` (`staff`, `player`), the tier that gates the plain
  `documents/acquire.json` / `documents/remove.json` endpoints.
- The frontend reads it from the character permissions payload (`AccessStore.ensureCharacterPermissions`)
  and exposes it on the page-level character object as `character.can_exchange_document`
  (fail-closed: missing → `false`).
