# Plan: Move npc update to `PATCH full.json`

Issue: [428-move-npc-update-to--patch-full-json.md](../issues/428-move-npc-update-to--patch-full-json.md)

## Overview

Move the character update action from the plain detail endpoints
(`PATCH /games/:game_slug/npcs/:id.json`, `PATCH /games/:game_slug/pcs/:id.json`) to the
existing, GM-only `full.json` endpoints (`.../npcs/:id/full.json`, `.../pcs/:id/full.json`),
which today are `GET`-only. The plain detail endpoints become `GET`-only. Backend adds `PATCH`
support to the full view; frontend repoints its single shared update call at `full.json` for
both character kinds. No permission-check logic changes — `CharacterEditPermission` /
`can_be_edited_by` stay exactly as they are today (confirmed with product-owner: this is a
routing move, not an access-rule change).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- New write surface: `PATCH /games/:game_slug/npcs/:id/full.json` and
  `PATCH /games/:game_slug/pcs/:id/full.json`.
  - Request body: same fields `CharacterUpdateSerializer` already accepts today via the plain
    endpoint — `name`, `role`, `public_description`, `private_description`, `hidden`, `money`,
    `allegiance`, `public_allegiance`, `slain`, `public_slain`, `links` (all optional/partial).
  - Success response: `200` with the `CharacterFullSerializer` shape (same as the existing
    `GET full.json` response — includes `private_description`), plus the `X-Skip-Cache: true`
    header the full endpoint already sets on every response.
  - Error responses, unchanged semantics: `401` (unauthenticated), `403` (authenticated but not
    an editor — same `can_be_edited_by` check as today), `400` with `{"errors": {...}}` on
    validation failure, `404` for an unknown/wrong-game/wrong-kind character id.
- Removed write surface: `PATCH /games/:game_slug/npcs/:id.json` and
  `PATCH /games/:game_slug/pcs/:id.json` stop accepting `PATCH` (405); only `GET` remains.
- Frontend's `CharacterClient#updateCharacter(characterKind, gameSlug, characterId, token, fields)`
  is the single call site both PC and NPC edit flows use (edit-page submit, and the NPC
  slain/public_slain toggle via `setNpcSlain`) — backend must guarantee the `full.json` PATCH
  contract above is available before frontend switches its URL, since both PCs and NPCs move
  together.
