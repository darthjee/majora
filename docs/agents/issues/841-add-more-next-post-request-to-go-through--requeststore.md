# Issue: Add more next POST request to go through `RequestStore`

## Description
Follow-up to #830 (implemented in `e165474f6838cf4b8368c120d160f8b28360e000`), which migrated a first slice of mutation (`POST`/`PATCH`/`PUT`) requests through `RequestStore` (`frontend/assets/js/utils/requests/RequestStore.js`) — PC edit, NPC edit, and NPC-new.

This issue continues that migration for a further batch of pages (treasures, game items, character-owned items, and the game-document "new" page), and introduces a standing migration-tracking document under `docs/agents/migration` so future migration issues can reference the same explanation instead of re-deriving it each time.

## Problem
- These pages still resolve their own mutation URLs/permissions ad hoc — via `TreasureClient`, `GameClient`/`CharacterClient`, or (for item updates) a raw `GenericClient#patchJson` call against a hand-built path, since no dedicated `ItemClient` exists yet — duplicating logic `RequestStore` already centralizes for `GET`.
- Several of these pages' single-resource `GET` reads are already migrated to `RequestStore`, but their mutations are not, so a successful create/update/photo-upload can leave the `GET` cache serving stale data — the same staleness gap #830 closed for PC/NPC.
- There is no single document explaining the overall mutation-migration approach and tracking which routes across the app still need it, so each new migration issue re-derives the same explanation from scratch.

## Expected Behavior
- `POST`/`PATCH`/`PUT` requests for the routes listed under "Next routes" (Solution, below) go through `RequestStore`, resolving the correct URL/permission variant the same way `GET` already does for these resources.
- After each mutation, `RequestStore`'s cached (settled, not in-flight) `GET` data for the affected resource is purged; an in-flight `GET` for that resource is aborted and restarted instead (reusing the existing permission-changed-mid-flight mechanic), same as #830.
- Photo-upload completions also purge the owning item/treasure's own show/index `GET` cache, mirroring #830's NPC-photo-upload cross-resource purge.
- Mutation requests never participate in `GET`'s de-dupe/attach/cache mechanic.
- `docs/agents/migration` gains a document that (a) explains the general mutation-migration approach once, for every future migration issue to reference during its discussion phase, and (b) tracks, as a checklist, every route in the app that still needs migrating vs. what's already migrated — kept current by each future migration issue/PR, and deleted entirely once the last route is migrated.

## Solution
Extend `treasureConfig.js`, `itemConfig.js`, and `documentConfig.js` with `POST`/`PATCH`/`PUT` entries the same way `pcConfig.js`/`npcConfig.js` already were in #830, and wire the routes below through `RequestStore.mutate` (or its `resolvePath`-only mode for photo-upload-init, see below).

### Next routes
- [ ] `/#/treasures` (photo upload)
- [ ] `/#/treasures/new`
- [ ] `/#/treasures/:id/edit`
- [ ] `/#/games/:game_slug/treasures/new` (game-scoped create)
- [ ] `/#/games/:game_slug/treasures/:treasure_id/edit` (game-scoped edit)
- [ ] `/#/games/:game_slug/items/new`
- [ ] `/#/games/:game_slug/items/:id/edit`
- [ ] `/#/games/:game_slug/items/:id` (photo upload)
- [ ] `/#/games/:game_slug/documents/new`
- [ ] `/#/games/:game_slug/pcs/:character_id/items/new`
- [ ] `/#/games/:game_slug/pcs/:character_id/items/:id/edit`
- [ ] `/#/games/:game_slug/pcs/:character_id/items/:id` (photo upload)
- [ ] `/#/games/:game_slug/npcs/:character_id/items/new`
- [ ] `/#/games/:game_slug/npcs/:character_id/items/:id/edit`
- [ ] `/#/games/:game_slug/npcs/:character_id/items/:id` (photo upload)

### Current state (confirmed by investigation)
- `itemConfig.js`, `treasureConfig.js`, `documentConfig.js` currently define `GET` only — no mutation entries exist yet for any of them.
- No `deleteJson` helper exists on `BaseClient.js` (only `getJson`/`postJson`/`patchJson`/`putJson`), and none of the routes above use a real HTTP `DELETE` — "removal" flows (item/treasure "remove") are `POST .../remove.json` / `.../remove/all.json`. Scope for this issue is `POST`/`PATCH`/`PUT` only.
- Item **updates** (edit pages) currently go through a raw `GenericClient#patchJson` call with a hand-built path — there is no dedicated `ItemClient` today, unlike `TreasureClient`/`CharacterClient`. This issue introduces an `ItemClient`, mirroring `TreasureClient`'s shape, so item mutations stop going through ad-hoc `GenericClient` calls.
- Photo upload (routes marked "photo upload" above) follows one of two existing patterns, neither `RequestStore`-aware today: `PhotoUploadModal` → `PhotoUploadModalController` → `UploadClient` (existing entity), or `PhotoUploadSaga` directly (new-entity create-then-upload flow). Following #830's PC/NPC precedent, the photo-upload-init endpoint should be modeled as a `resolvePath`-only `POST` entry (used only to resolve the URL/permission, not routed through `RequestStore.mutate` itself, since `UploadClient` owns the actual multipart request) — while the upload's *completion* still purges the owning resource's cache.

### Out of scope (candidate follow-up issue)
The item/treasure exchange modal tabs (Acquire/Remove item, Acquire/Remove/Buy/Sell treasure — `AcquireItemTabController.js`, `RemoveItemTabController.js`, `AcquireTreasureTabController.js`, `RemoveTreasureTabController.js`, `BuyTreasureTabController.js`, `SellTreasureTabController.js`) all fire `POST` mutations via `CharacterClient` (plus `*/all` bulk variants), none through `RequestStore` yet — even though their `GET` half (`item.availableCollection`) was already migrated in #773. Deliberately excluded from this issue's scope; file as a separate follow-up.

### Documentation
Add `docs/agents/migration` (does not exist yet) containing:
- A general explanation of the mutation-migration approach (not endpoint-specific), referenced by future issues during their discussion phase.
- A checklist of every route in the app needing migration, marking the ones already done (PC edit, NPC edit, NPC new from #830, plus whatever this issue completes). Updated by each future migration issue/PR; removed once the last route is migrated.

### Components leak
If a shared component (e.g. photo upload) is used by both an in-scope and an out-of-scope page, migrating the component is fine even though it "leaks" into the not-yet-migrated page — the other page doesn't need full migration as a result.

## Benefits
- Components no longer need to duplicate permission-to-URL resolution logic for treasure/item/document mutations — `RequestStore` centralizes it, same as it already does for `GET`.
- `GET` responses for treasures/items can no longer go stale after a mutation or photo upload, without giving up the in-memory cache/de-dup benefits reads get from `RequestStore`.
- A standing `docs/agents/migration` document removes the need to re-explain the migration approach from scratch in every future issue, and gives a single place to track overall rollout progress.
