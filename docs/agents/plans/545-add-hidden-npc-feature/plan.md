# Plan: Add hidden Npc feature

Issue: [545-add-hidden-npc-feature.md](../../issues/545-add-hidden-npc-feature.md)

## Overview

`Character.hidden` already exists in the DB and is already writable via `CharacterCreateSerializer`/`CharacterUpdateSerializer`, and the public-facing NPC endpoints already correctly hide/exclude hidden NPCs. What's missing is the DM/admin-facing surface: reading `hidden` back (`CharacterFullSerializer`/`CharacterFullListSerializer`), filtering by it on the DM/admin "all NPCs" endpoint, a bootstrap switch on the New and Edit NPC forms (NPC-only, DM/admin-only), a "Hidden" tooltip badge wherever the info bar renders, and a slight photo transparency effect (form preview + DM/admin NPC cards). New user-visible strings are added via `Translator.t()`.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)

## Shared contracts

### `hidden` field on read serializers (backend produces, frontend consumes)

`CharacterFullSerializer` (used by `GET/PATCH /games/:game_slug/npcs/:id/full.json`) and `CharacterFullListSerializer` (used by `GET /games/:game_slug/npcs/all.json`) both gain a read-only `hidden` boolean field, e.g.:

```json
{ "id": 1, "name": "...", "hidden": true, "...": "..." }
```

`CharacterDetailSerializer`/`CharacterListSerializer` (public-facing) are unchanged — they must never expose `hidden`.

### `hidden` query filter (backend produces, frontend consumes)

`GET /games/:game_slug/npcs/all.json?hidden=true|false` filters the DM/admin "all NPCs" list by the real `hidden` field, following the exact `slain`/`allegiance` query-param pattern already implemented in `_filter_characters` (`backend/games/views/game/_shared.py`). This filter param only applies to `all.json` — the public `npcs.json` list keeps its unconditional `hidden=False` exclusion, untouched.

### Translation keys (translator produces, frontend consumes via `Translator.t()`)

- `npc_edit_page.hidden_label` (new) — Edit NPC form switch label.
- `game_npc_new_page.hidden_label` (existing key, text updated) — New NPC form switch label, updated to match the Edit form's wording.
- `character_status_badges.hidden` (new) — tooltip badge text.
- New keys under `game_npcs_page` for the DM/admin-only "Hidden" list filter (exact key names finalized by whichever component the `frontend` agent implements — see `translator.md`).

### NPC-only, DM/admin-only scope (confirmed with the user during issue discussion)

The `hidden` switch/filter/indicators are NPC-only, even though `Character.hidden` is a field on the shared model also used by PCs — the switch must never render on PC edit forms. The switch/filter are only ever shown to DM/admin (existing `state.isFullEditor`/`canEdit` flags on the frontend, existing `GameEditPermission`/`CharacterEditPermission` checks on the backend — no new permission class needed anywhere).

## Notes

- No new entity or endpoint is introduced, and no access-control logic changes (permissions on the touched endpoints are already correct) — `product-owner`/`security` review was not required for planning this issue, but a `data-access` read-only review is still worth running once implemented, since a previously-unexposed field (`hidden`) becomes readable on two existing endpoints.
