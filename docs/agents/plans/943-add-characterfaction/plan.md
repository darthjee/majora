# Plan: Add CharacterFaction

Issue: [943-add-characterfaction.md](../../issues/943-add-characterfaction.md)

## Overview

Finish the half-adopted `Faction` → `GameFaction` naming convention (model, photo model, serializers, factory), replace the dead unused `Character.factions` M2M with a proper `CharacterFaction` through-model (mirroring `CharacterDocument`'s shape exactly), and wire up the full enlist/quit/recruit feature: an "enlist"/"quit" exchange modal on the character side (relabeled `ResourceExchangeModal`, same pattern as documents/items/possessions), a new "recruit" give-style modal + a real paginated character-list panel on the faction show page, and the backing acquire/remove/summary/available endpoints for both PCs and NPCs. A per-row "kick" control on the faction panel is explicitly out of scope, split to [#1106](https://github.com/darthjee/majora/issues/1106).

## Agents involved

- [backend](backend.md)
- [frontend](frontend.md)
- [translator](translator.md)
- [cache](cache.md)

## Shared contracts

### Backend → Frontend (API surface)

**Renamed resource.** Every existing `Faction`/`FactionPhoto` payload shape (`GameFactionListSerializer`, `GameFactionUpdateSerializer`, `GameFactionPhotoSerializer`) is unchanged in *content* — only the Python class/file names change. The frontend's existing `resourceConfig`/`factionConfig.js` request-building for `faction`'s own CRUD endpoints does not need field-shape changes, only needs verifying that nothing there imports a backend-side class name directly (it shouldn't — the frontend never imports Python).

**New `CharacterFaction` shape**, mirroring `CharacterDocumentSerializer`/`CharacterDocumentAllSerializer` exactly, field-for-field with `document`→`faction` substitution:

- `CharacterFactionSerializer`: `id`, `game_faction_id`, `name` (from `game_faction.name`), `photo_path` (from `game_faction.photo.path`). No `description` — `GameFaction` has no description field (unlike `GameDocument`), so this field is dropped, not carried over.
- `CharacterFactionAllSerializer`: adds `hidden` on top.

**New character-centric routes** (both `pcs` and `npcs`, via `_CHARACTER_ROUTES`, i.e. `/games/<slug>/pcs/<character_id>/...`): `/factions.json`, `/factions/all.json`, `/factions/<id>.json` (+`/full.json`), `/factions/available.json` (+`/available/all.json`), `/factions/acquire.json` (+`/acquire/all.json`), `/factions/remove.json` (+`/remove/all.json`).

**New faction-centric routes** (registered in `urls/games.py`, i.e. `/games/<slug>/factions/<faction_id>/...`, same placement as the equivalent document routes): `/factions/<faction_id>/pcs/<character_id>/summary.json` (+`/summary/all.json`, + the `npcs` equivalents) returning `{'enlisted': <bool>}`; and `/factions/<faction_id>/characters.json` (regular — no `X-Skip-Cache`) / `/factions/<faction_id>/characters/all.json` (restricted — always `X-Skip-Cache: true`), each item shaped `{id, name, type, photo_path}` where `type` is `'pc'`/`'npc'`.

**Acquire/remove payload**: `{game_faction_id: <int>}` for acquire/remove, `{game_faction_id: <int>, hidden: <bool|null>}` for acquire — same shape as documents.

**Error codes**: acquiring an already-enlisted faction → `422` with `{errors: {game_faction_id: ['game_faction_already_enlisted']}}`. Removing a non-membership → `404`.

Frontend owns picking the `regular` vs `restricted`/`/all.json` variant per request (`canGiveHidden`/`canRecruitHidden`-style flag) — backend enforces it independently via the `game_pc_faction`/`game_npc_faction` permission tiers regardless of which variant the frontend calls, so a frontend bug here fails closed (403), never open.

### Frontend → Translator (i18n keys)

New/changed keys needed — see [frontend.md](frontend.md)'s "Files to Change" for the exact components driving each, and [translator.md](translator.md) for the full key list with both `en`/`pt` values. At minimum: `faction_exchange_modal.*` (acquire/remove tab labels — "Enlist"/"Quit" — and tooltips), `character_page.factions_shortlist_title` (or equivalent shortlist heading), `recruit_modal.*` (mirroring `give_document_modal.*` 1:1), `faction_page.characters_panel_empty` (empty-state text), and any label/error keys the new faction character-list cards need. Both `en` and `pt` locales need every key; `npm run check_i18n` is the CI gate that catches drift.

### Backend/Frontend → Cache (navi)

New endpoints the cache warmer must walk — see [cache.md](cache.md). Nothing here is consumed by the app at runtime; it only affects `navi`'s own crawl config.

## Notes

- The `Faction` → `GameFaction` rename touches model/serializer/factory names only — no `db_table`/field renames beyond what Django's `RenameModel` migration operation handles automatically (table + all FK references). Backend must generate this migration with `RenameModel`, never a manual drop/recreate, so existing `Faction` rows and their `HistoricalFaction` audit trail survive.
- `simple_history.HistoricalRecords()` on a renamed model produces a correspondingly renamed historical model (`HistoricalFaction` → `HistoricalGameFaction`) on the next `makemigrations` run — backend must let Django's migration autodetector handle this (do not hand-write the historical rename) and mirror it into `backend/versioning/migrations/`.
- No frontend renames are needed — the frontend already mirrors the same short-name-in-helpers convention `CharacterDocument` uses (top-level page components say `GameFaction`, inner helpers/elements say `Faction`), so nothing there currently assumes the un-prefixed backend class names.
- A per-row "kick"/remove control on the faction's character-list panel is explicitly out of scope — tracked as [#1106](https://github.com/darthjee/majora/issues/1106).
- Any `hidden` concept on `GameFaction` itself (and any faction-level 404 gate) is explicitly out of scope for this issue.
