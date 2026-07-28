# Issue: Add incognito for NPC

## Description
NPCs currently support a `hidden` boolean: a hidden NPC is entirely unknown to players (public NPC listings and detail pages 404 for it unless the requester is a full editor). This issue adds a second, weaker state — `incognito` — for an NPC that players have heard about (e.g. by name or reputation) but have not yet met in person.

## Problem
Today an NPC is either fully hidden (`hidden = true`, unknown to players) or fully visible. There is no way to represent an NPC that players are aware of but have not personally encountered — e.g. one whose face/portrait shouldn't be revealed yet, while everything else about them (name, description) stays visible.

## Solution
- Add a new `incognito` boolean field to the shared `Character` model (migration required — this field does not currently exist for either PCs or NPCs, `backend/games/models/character/character.py`), mirroring how `hidden` is modeled today. This issue only wires up form/badge support for NPCs; PCs get the column but no UI yet.
- If an NPC is both `hidden` and `incognito`, `hidden` takes precedence — its existing 404-gate behavior applies regardless of `incognito`.
- Add an `incognito` switch to the NPC forms, beneath the existing `hidden` switch (mirroring `CharacterHiddenSlot.jsx`):
  - create NPC — `/#/games/:game_slug/npcs/new`
  - edit NPC — `/#/games/:game_slug/npcs/:id/edit`
- Expose `incognito` on the private NPC endpoints, following the same private-only pattern `hidden` already uses (`CharacterFullSerializer` / `CharacterFullListSerializer`):
  - `GET /games/:game_slug/npcs/:id/full.json`
  - `GET /games/:game_slug/npcs/all.json`
  - `PATCH /games/:game_slug/npcs/:id/full.json`
  - `POST /games/:game_slug/npcs/full.json` (create)
- Public serializer changes (`CharacterListSerializer` / `CharacterDetailSerializer`):
  - `GET /games/:game_slug/npcs.json`
  - `GET /games/:game_slug/npcs/:id.json`
  - These endpoints do not expose the `incognito` field itself
  - When `incognito` is true, `profile_photo_path` is returned as `null`
  - Private endpoints are unaffected
- Add an incognito badge to the NPC list and NPC show page:
  - Pages: `/#/games/:game_slug/npcs`, `/#/games/:game_slug/npcs/:id`
  - Bootstrap icon: `bi-incognito`
  - Tooltip text: "NPC is incognito"
  - Visible only to `dm` and `admin` roles

## What this issue is not about
- Changes to permission rules themselves (badge visibility reuses existing dm/admin checks)
- Creation of new endpoints
- Creation of new pages
- Changes to the proxy
