# Plan: Allow players to do some minor edits to NPCs

Issue: [416-allow-players-to-do-some-minor-edits-to-npcs.md](../issues/416-allow-players-to-do-some-minor-edits-to-npcs.md)

## Overview

Give any player of a game (not just its owner — NPCs have none) a narrow write: toggling an
NPC's `public_slain` state through the plain `PATCH /games/:game_slug/npcs/:id.json` endpoint,
using a minimal serializer that only accepts `{"slain": true|false}`. GMs/superusers keep this
endpoint working too (backend allows both authorization paths), but the frontend only routes
the new player-facing Revive/Mark-as-Slain buttons through it — the existing DM edit form and
DM slain toggle keep using `full.json`, per #428.

**Depends on #428**: this plan assumes the post-428 shape is already in place — the plain NPC
detail view is GET-only (its old PATCH/`CharacterUpdateSerializer` path removed) and
`full.json` handles the GM full update. Implement #428 first; do not start this plan against a
pre-428 checkout.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- New write surface: `PATCH /games/:game_slug/npcs/:id.json`.
  - Request body: `{"slain": true|false}` only — no other field is accepted.
  - Effect: writes the NPC's `public_slain` column (not the real `slain` column).
  - Permission: allowed for (a) a player of the game — same "is a player of this game" check
    used to compute `is_player` on `.../access.json` (`game.players.filter(user=user).exists()`),
    OR (b) the existing `CharacterEditPermission` (GM of the game / superuser). Same
    401/403/404 semantics as every other character endpoint.
  - Success response: `200` with the same `CharacterDetailSerializer` shape the endpoint's
    `GET` already returns (so `slain` in the response is still the public-facing alias of
    `public_slain`, unchanged), with `X-Skip-Cache: true`.
- No backend serializer change is needed to expose `is_player`: it's already computed by
  `CharacterAccessSerializer`/`GameAccessSerializer` (`BaseAccessSerializer._get_is_player`,
  `source/games/serializers/base_access.py:68-81`) and already fetched by the frontend today
  (`AccessStore.ensureCharacterAccess` / `ensureGameAccess`), just discarded. Frontend-only
  work: merge `is_player` from those existing access responses into the values the NPC show
  and index pages already read, alongside the existing `can_edit`.
