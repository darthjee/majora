# Plan: Faction Character List Cache Not Purged When A Character Is Kicked From A Faction

Issue: [1119-faction-character-list-cache-not-purged-when-a-character-is-kicked-from-a-faction.md](../issues/1119-faction-character-list-cache-not-purged-when-a-character-is-kicked-from-a-faction.md)

## Overview

Move `faction_id` from the POST body into the URL path on the four PC/NPC faction remove/remove-all endpoints, so the proxy's existing placeholder-substitution cache-cleanup mechanism can capture it and purge the faction's own `/games/:game_slug/factions/:faction_id/characters.json` cache on kick — the same way `factions.php`'s `photo_upload.json` trigger already purges `factions/:faction_id.json` today. Backend and frontend both change the endpoint's request shape; proxy wires the new purge target; cache re-verifies the Navi warm-up config is unaffected.

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [proxy](proxy.md)
- [cache](cache.md)

## Shared contracts

**New endpoint URL shape** (all four route pairs — PC and NPC, remove and remove-all):

- `POST /games/:game_slug/pcs/:character_id/factions/:faction_id/remove.json`
- `POST /games/:game_slug/pcs/:character_id/factions/:faction_id/remove/all.json`
- `POST /games/:game_slug/npcs/:character_id/factions/:faction_id/remove.json`
- `POST /games/:game_slug/npcs/:character_id/factions/:faction_id/remove/all.json`

`faction_id` (the `GameFaction` id) moves from the POST body (`game_faction_id`) to a URL path
segment, matching the existing `<int:faction_id>` convention already used by
`/factions/<faction_id>.json`/`/factions/<faction_id>/full.json`. The body no longer carries
`game_faction_id` — backend drops the field entirely rather than accepting it in both places.
Response codes/behavior are otherwise unchanged: `204` on success, `404` under the same
conditions as today (unknown/unenlisted/hidden-and-not-allowed), now keyed off the URL's
`faction_id` instead of the body's `game_faction_id`.

Backend consumes: nothing new from frontend/proxy.
Frontend must produce: requests to the new URL shape (both `FactionCharactersPanelController.kick()`
and `RemoveFactionTabController.remove()`, which share `factionConfig.js`'s `remove`/`removeAll`
path builders) — this is a breaking, no-fallback change, so backend and frontend land together.
Proxy consumes: the new `:faction_id` placeholder becomes capturable on these trigger routes,
letting `pcs.php`/`npcs.php` add `/games/:game_slug/factions/:faction_id/characters.json` to their
existing `factions/remove.json`/`factions/remove/all.json` target groups.
