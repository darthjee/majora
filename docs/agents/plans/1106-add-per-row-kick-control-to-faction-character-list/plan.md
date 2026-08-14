# Plan: Add per-row kick control to faction character list

Issue: [1106-add-per-row-kick-control-to-faction-character-list.md](../issues/1106-add-per-row-kick-control-to-faction-character-list.md)

## Overview

Add a per-row "kick" control to the faction show page's character-list panel (`FactionCharacterCard`), letting any player (or DM/admin, for hidden members) remove a character from the faction directly, reusing the existing per-character `factions/remove(.json|/all.json)` endpoints as-is — no backend changes. The card is restructured from a plain `<a>`-wrapped card to a `stretched-link` + sibling action-button shape (mirroring `TreasureCardHelper`), gated behind a new `KickConfirmModal`. Proxy-level cache-cleanup config is extended so the target character's own `factions.json` cache is purged on kick; the faction panel's own cache-purge gap is tracked separately in #1119 and out of scope here.

## Agents involved

- [frontend](frontend.md)
- [proxy](proxy.md)

## Shared contracts

- **Endpoints reused, unchanged**: `/games/:game_slug/pcs/:id/factions/remove.json`, `/games/:game_slug/pcs/:id/factions/remove/all.json`, and NPC equivalents under `/games/:game_slug/npcs/:id/factions/...`. No new backend endpoint, serializer field, or permission logic — both agents build against these exact, pre-existing routes.
- **Proxy cache-cleanup additions**: the proxy agent adds cache-cleanup entries so these same trigger routes purge `/games/:game_slug/pcs/:character_id/factions.json` and `/games/:game_slug/npcs/:character_id/factions.json` respectively. This is a server-side (proxy) HTTP-cache purge, independent of the frontend's own client-side cache purge.
- **Faction panel's own cache is NOT purged by the proxy change**: `/games/:game_slug/factions/:faction_id/characters.json` cannot be purged via this mechanism (the trigger routes don't carry `:faction_id` in the URL — tracked in #1119). The frontend agent must not rely on proxy-side freshness for this endpoint — it must force its own refetch (`refreshToken`) and its own client-side `RequestStore.purge({ resource: 'faction' })` call after a successful kick, exactly like `RemoveFactionTabController.confirmRemove` already does today for the character-page quit flow.
- **Request shape for the kick call** (frontend, for reference — no proxy involvement): `RequestStore.mutate({ resource: 'faction', quantityType: 'remove', variantName: <'regular'|'private'>, params: { gameSlug, kind: <'pcs'|'npcs'>, id: <characterId> }, body: { game_faction_id: <factionId> }, method: 'POST' })`, identical to the existing call in `RemoveFactionTabController.js:85-98`.
