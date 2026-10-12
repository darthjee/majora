# Plan: Game content copy: Factions tab

Issue: [1576-game-content-copy-factions-tab.md](../../issues/1576-game-content-copy-factions-tab.md)

## Overview
Add the `factions` copy type to the staff copy page, following the pattern of the Possessions
tab (commit 79fa3d2a) and the spec `docs/agents/specs/game-content-copy/factions.md`. The backend
adds a `FactionsCopyType` (list with `name_taken_in_target`, copy with `422` on a name clash,
cover photo link, cache paths including every target character's `factions/available.json`); the
frontend adds the Factions row component. The 422 handling, the "name already used" badge and all
i18n keys already exist on the frontend, so `translator` has no work.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)

## Shared contracts

- `GET /staff/copies/factions.json?from=<slug>&to=<slug>` — paginated, ordered by `id`, rows:
  - `id` (int) — source faction id
  - `name` (string)
  - `photo` (string|null) — cover path only when `ready`
  - `copied_to_target` (bool)
  - `name_taken_in_target` (bool) — a `GameFaction` with the same `name` exists in the target game
- `POST /staff/copies/factions/<id>.json` `{target}` — `201 {id, links}` (`links` has 0 or 1
  entry, the cover); `422 {"errors": {"name": ["unique"]}}` on a name clash, nothing created and no
  `X-Cache-Clear`.
- Tab slug: `factions` (frontend `ROWS` key, backend copy type name).
