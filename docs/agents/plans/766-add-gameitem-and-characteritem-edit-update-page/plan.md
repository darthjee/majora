# Plan: Add GameItem and CharacterItem edit/update page

Issue: [766-add-gameitem-and-characteritem-edit-update-page.md](../../issues/766-add-gameitem-and-characteritem-edit-update-page.md)

## Overview

Add three edit pages (game-scoped item, PC item, NPC item), each backed by a PATCH endpoint that updates only `name`/`description`/`hidden` (photo keeps its own existing upload endpoint). No new URL paths are introduced on the backend — the existing `GET .../items/:id.json` detail routes gain PATCH support. The NPC item PATCH additionally enforces the existing hidden-NPC visibility gate so `staff` loses access when the NPC is hidden and they lack permission to view hidden NPCs.

> **Depends on #765**: this plan assumes `.../items/:id/full.json` (renamed from `all.json`) and the `*DetailFullSerializer` names are already in place. If #765 hasn't landed yet when implementation starts, use the pre-rename `*DetailAllSerializer` names and coordinate the eventual rename.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [proxy](proxy.md)

## Shared contracts

- **Endpoints** (no new paths — existing GET routes gain PATCH):
  - `PATCH /games/:game_slug/items/:id.json` — updates `GameItem` only. Permission: dm/admin only (`GameEditPermission`). Body: partial `{name?, description?, hidden?}`.
  - `PATCH /games/:game_slug/pcs/:character_id/items/:id.json` — updates `CharacterItem` only. Permission: dm/admin/staff/owner (`CharacterItemCreatePermission`, reused as-is).
  - `PATCH /games/:game_slug/npcs/:character_id/items/:id.json` — updates `CharacterItem` only. Permission: same as PC, **plus** a pre-check reusing `_hidden_gate_response` (`backend/games/views/game/_shared.py`) — if the NPC is hidden and the requester cannot edit it (not dm/admin/superuser), respond 404 before any permission/update logic runs, exactly like `GET /games/:game_slug/npcs/:character_id` already does.
  - Response on success: 200 with the same detail-full serializer the GET route already returns (`GameItemDetailFullSerializer` / `CharacterItemDetailFullSerializer`) — unchanged shape from what the frontend already consumes on the show page.
- **Blank-field semantics (CharacterItem only)**: submitting `name`/`description` as an empty string persists `null` on `CharacterItem` (reverting to the linked `GameItem`'s value via the existing fallback), not an empty string. `GameItem`'s own `name` stays required/non-blank — there's no fallback target for it.
- **No new backend URL paths**: the frontend must PATCH the exact same path it already GETs for the show page (`.../items/:id.json` for game items is a separate route from `.../items/:id/full.json`, so double check — see [backend.md](backend.md) for the precise existing route each PATCH lands on).
- **Proxy cache invalidation**: because `.../items/:id.json` (all three scopes) becomes a mutating route for the first time, it must be added to the `routes` (trigger) list in the corresponding `items`/`pcs`/`npcs` cache-cleanup groups — mirroring how `.../pcs/:character_id.json` and `.../npcs/:character_id.json` already appear in both `targets` and `routes` today. Without this, PATCHing an item would leave stale cached responses.
- **Shared opacity constant**: `frontend/assets/css/main.scss`'s single dimmed-photo rule (currently `opacity: 0.8`) changes to `opacity: 0.6`. This is a frontend-only change but affects existing Character edit/creation/list-card usages too — intentional, per the issue.
