# Plan: Refactor public slain and allegiance

Issue: [861-refactor-public-slain-and-alligiance.md](../../issues/861-refactor-public-slain-and-alligiance.md)

## Overview

Rename `Character.slain`/`Character.allegiance` to `private_slain`/`private_allegiance` (matching the existing `public_description`/`private_description` convention), remove all the public-endpoint read/write transformation that currently aliases these to/from `public_slain`/`public_allegiance`, and update the frontend (buttons, selects, filters, list border/grayscale logic) and translations to match. Both PC and NPC (`Character`) are affected, but the frontend UI surface (buttons, selects, filters) only changes for NPCs — PCs already have no allegiance/slain UI today.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### 1. Character field & endpoint contract (backend → frontend)

**Model column rename**: `Character.slain` → `Character.private_slain`, `Character.allegiance` → `Character.private_allegiance`. `public_slain`/`public_allegiance` are unchanged.

**Serializer response keys**
- Public read endpoints — `CharacterListSerializer` (`GET pcs.json`/`npcs.json`) and `CharacterDetailSerializer` (`GET pcs/:id.json`/`npcs/:id.json`): expose `public_slain`, `public_allegiance` only, as plain (non-aliased) fields. `slain`/`allegiance` no longer appear anywhere.
- Private/full read endpoints — `CharacterFullSerializer` (`GET .../full.json`) and `CharacterFullListSerializer` (`GET npcs/all.json`): expose all four — `public_slain`, `public_allegiance`, `private_slain`, `private_allegiance` — alongside the existing `private_description`.

**Write payload keys**
- Public patch — `NpcPlayerUpdateSerializer` (`PATCH npcs/:id.json`, player/staff-facing): accepts wire keys `public_slain`, `public_allegiance` (renamed from today's `slain`/`allegiance`). Never writes `private_*`.
- Full patch — `CharacterUpdateSerializer` (`PATCH pcs|npcs/:id/full.json`, DM/admin/owner-facing): accepts `private_slain`, `private_allegiance`, `public_slain`, `public_allegiance`.
- Create — `CharacterCreateSerializer` (`POST npcs.json`): accepts `private_allegiance`, `public_allegiance`.

**NPC index filter query params**
- `GET /games/:game_slug/npcs.json` (public): `public_slain=true|false`, `public_allegiance=ally|enemy|neutral`. A `private_slain`/`private_allegiance` param, if sent, is ignored.
- `GET /games/:game_slug/npcs/all.json` (DM/admin): `public_slain`, `private_slain`, `public_allegiance`, `private_allegiance` — each independently filterable, combinable (AND). Plus the existing `name`, `hidden`.

There is **no** dedicated `PATCH .../npcs/:character_id/slain.json` endpoint in the codebase today (the issue's endpoint list mentions one, but slain is only ever written through `full.json` (DM/admin, both slain fields) or the narrow public `.json` patch (`public_slain` only) — there's nothing to add here; treat that line item as already covered by the two endpoints above.

### 2. Renamed i18n keys (frontend → translator)

The frontend agent decides the definitive old-key → new-key mapping and any newly-added keys as it touches each component (e.g. `npc_edit_page.allegiance_label` likely becomes `private_allegiance_label`; new NPC filter keys are needed for the two added private filters), then hands that mapping to the translator agent. The translator agent applies the same rename/addition to every locale file under `frontend/assets/i18n/` (English text stays exactly the same) and keeps `npm run check_i18n` green.
