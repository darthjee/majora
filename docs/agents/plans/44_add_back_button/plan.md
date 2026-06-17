# Plan: Add back button

Issue: [44_add_back_button.md](../../issues/44_add_back_button.md)

## Branch

`issue-44`

## Overview

Add back navigation across the app. Before a back button can be added to the character detail page, its ambiguous route/endpoint (`/games/:slug/characters/:id`, reachable from both PCs and NPCs index) must be split into PC-specific and NPC-specific variants. Backend adds two new filtered detail endpoints; frontend splits the character route into `npcs/:id` and `pcs/:id`, then adds a small reusable `BackButton` component used on every listed page.

## Agents involved

- [Backend](backend.md)
- [Frontend](frontend.md)

## Shared contracts

- New endpoint: `GET /games/:game_slug/npcs/:character_id.json` → same JSON shape as current `character_detail` (via `CharacterDetailSerializer`), but 404s if the character is not an NPC (`npc=True`).
- New endpoint: `GET /games/:game_slug/pcs/:character_id.json` → same shape, 404s if the character is not a PC (`npc=False`).
- The old endpoint `GET /games/:game_slug/characters/:character_id.json` and URL name `character-detail` are removed; frontend must call the two new endpoints instead.
- New frontend routes: `/games/:game_slug/npcs/:character_id` → page key `npcCharacter`; `/games/:game_slug/pcs/:character_id` → page key `pcCharacter`. The old `/games/:game_slug/characters/:character_id` route and `character` page key are removed.
