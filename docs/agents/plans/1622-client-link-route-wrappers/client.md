# Plan: Client: link route wrappers

Issue: [1622-client-link-route-wrappers.md](../../issues/1622-client-link-route-wrappers.md)

## Overview

Wrap the character ↔ faction / document / item link routes for PCs and NPCs as bound
sub-wrappers (same pattern as `documents.pages(id)`), and add `factions.characters(id)` and
`<family>.summary(id, kind, characterId)` on the linked families. No scope checks in the
wrapper; `POST`s are never retried (already the `HttpClient` behaviour).

## Context

- Routes: `backend/games/urls/_character_routes.py` (character side) and
  `backend/games/urls/games.py` (faction members, summaries).
- Verified in the backend:
  - `acquire` and `remove` (and their `/all` variants) are all `POST`.
  - Faction removal is `factions/<faction_id>/remove(.json|/all.json)`; item/document removal
    takes the target in the body (`game_item_id`, …), so it posts to `remove(.json|/all.json)`.
  - `available` lists, the character link lists and `factions/<id>/characters` are paginated
    (`paginated_list_response`): they return a `Page` and get an `iterate*` counterpart.
  - Summaries (`<family>/<id>/<pcs|npcs>/<character_id>/summary(.json|/all.json)`) return one
    object.
- Base classes: `Resource` (variant map + `pathFor`, `:id` placeholder only), `GameResource`,
  `CharacterResource` (shared by `Npcs`/`Pcs`), `DocumentPages` (the bound sub-wrapper
  template to copy).

## Steps

- [01 — Character link sub-wrappers](client/01-character-link-sub-wrappers.md)
- [02 — Faction members and summaries](client/02-members-and-summaries.md)
- [03 — Specs](client/03-specs.md)
- [04 — Docs](client/04-docs.md)

## CI Checks

- `client`: `make client-tests` (CI job: `client_tests`)
- `client`: `make client-lint` (CI job: `client_checks`)
- docs: markdownlint (CI job: `markdownlint`)

## Notes

- Method names are fixed by the issue: `items(id)`, `documents(id)`, `factions(id)` on
  `npcs`/`pcs`; `list`/`iterate`, `get`, `available`/`iterateAvailable`, `acquire(data)`,
  `remove(data)` (items/documents) or `remove(factionId, data?)` (factions);
  `factions.characters(id)`/`iterateCharacters(id)`; `items|documents|factions.summary(id, kind, characterId)`.
- Bodies are passed through as-is; no field renaming or validation.
- Out of scope: character-item create/update (`POST items.json`, `PATCH items/<id>.json`),
  item photo upload (#1623), document files/photos sub-routes, possessions/recipes/treasures,
  and CLI commands for these routes.
