# Plan: npc filters is not respecting view as

Issue: [479-npc-filters-is-not-respecting-view-as.md](../../issues/479-npc-filters-is-not-respecting-view-as.md)

## Overview

`GameNpcsController#fetchNpcs` currently races two endpoints (`/games/:slug/npcs.json` and `/games/:slug/npcs/all.json`) and opportunistically prefers the `all.json` result whenever a raw auth token is present, regardless of any "View as" role simulation. This plan rewrites endpoint selection to resolve the effective, facade-aware `can_edit` permission first (mirroring `GameTreasuresController`), then fetch a single matching endpoint — so filtered and unfiltered NPC requests correctly respect "View as".

## Context

- `AccessStore.ensureGamePermissions(gameSlug)` is facade-aware: it threads the "View as" simulated role (`AccessStoreFacade`) into the `can_edit` check. `AccessStore.ensureGameAccess(gameSlug)` (used for `is_player`) is **not** facade-aware — it always reflects the requester's real identity — so it must not be used for endpoint selection.
- `GameTreasuresController#loadTreasures`/`#fetchTreasures` (`frontend/assets/js/components/resources/treasure/pages/controllers/GameTreasuresController.js:97-121`) is the existing correct pattern: resolve `can_edit` via `ensureGamePermissions` first, then fetch exactly one endpoint (`treasures/all.json` vs `treasures.json`).
- This issue is scoped to `GameNpcsController` only. `GameController#fetchNpcsPreview` (the NPC preview widget on the game page) has the identical bug pattern but is explicitly out of scope — do not touch it.
- `setIsPlayer`/`access.is_player` (from `ensureGameAccess`) is unrelated to this fix — it gates the player-facing slain/revive button and stays as-is.

## Implementation Steps

### Step 1 — Rework `#fetchAccess`/`#fetchNpcs` to resolve `can_edit` before fetching

In `frontend/assets/js/components/resources/character/pages/controllers/GameNpcsController.js`:

- Keep `#fetchAccess` fetching `is_player` (for `setIsPlayer`, unrelated to this fix) but have it also resolve `can_edit` via `AccessStore.ensureGamePermissions(gameSlug)`, and pass `can_edit` forward into NPC fetching instead of letting `#fetchNpcs` run independently off of raw token presence.
- Sequence `buildEffect()` so NPC fetching happens after (or as part of) permission resolution: resolve `is_player`/`can_edit` first (`Promise.all` or chained), then call `#fetchNpcs(gameSlug, canEdit, safeSet)`.
- Rewrite `#fetchNpcs(gameSlug, canEdit, safeSet)` to build a single path — `` `/games/${gameSlug}/npcs/all.json` `` when `canEdit` is true, `` `/games/${gameSlug}/npcs.json` `` otherwise — and issue one `fetchIndex`/`fetchNpcsAll`-equivalent request with pagination + filter params, instead of racing `publicFetch`/`allFetch`.
- Remove the now-unused dual-fetch machinery: `#applyNpcsResult`, `#applyPublicNpcs`, `#applyAuthNpcs`, `#tryGetAuthNpcs`, and the `AuthStorage` import/usage for endpoint selection (`AuthStorage` may still be needed if `characterClient.fetchNpcsAll` requires a token argument — check its signature and keep only what's still used).
- Check `CharacterClient#fetchNpcsAll` (used for the `all.json` request) and `GenericClient#fetchIndex` (used for `npcs.json`) — both must accept pagination + filter params consistently; if `fetchNpcsAll` returns a raw `Response` (needing `.json()`/header parsing via `#parsePagination`) while `fetchIndex` returns `{ data, pagination }` already parsed, keep using the appropriate one per branch, reusing `#parsePagination`/`#parsePositiveInt` only for the `all.json` branch as today.
- Preserve existing behavior for pagination params: currently `fetchIndex` (public) only receives `filterParams`, while `fetchNpcsAll` receives `{...paginationParams, ...filterParams}` — carry the correct params to whichever single endpoint is chosen (the `all.json` branch needs pagination, matching current auth behavior; check whether `npcs.json` needs pagination params too since a player-scoped call is now the only call when `canEdit` is false — add `paginationParams` there as well, since it's now the sole request for players and the response format already returns pagination via `fetchIndex`'s parsed headers).

### Step 2 — Update the NPC list fetch spec

In `frontend/specs/assets/js/components/resources/character/pages/controllers/GameNpcsController/npcListFetchSpec.js`:

- Replace the dual-fetch-racing test cases ("skips the auth fetch when no token is stored", "uses the authenticated NPC list when the auth fetch succeeds", "falls back to the public NPC list when the auth fetch returns a non-ok response", "falls back to the public NPC list when the auth fetch rejects") with cases that spy on `AccessStore.ensureGamePermissions` to return `{ can_edit: true }` or `{ can_edit: false }` and assert exactly one of `characterClient.fetchNpcsAll` / `client.fetchIndex` is called, with the other never called.
- Keep/adapt the params-forwarding tests ("forwards the current page/per_page...", "forwards active slain/name filters...") to assert against whichever single endpoint is active for that test's `can_edit` value.
- Add a test asserting `canEdit: false` (simulating "View as" a player) results in `/games/:slug/npcs.json` being called — even when `AuthStorage` has a token set — covering the exact regression from this issue.
- `canEditSpec.js` and `isPlayerSpec.js` in the same folder likely already cover `setCanEdit`/`setIsPlayer` wiring from `#fetchAccess` — check whether they need updates to match the new `#fetchAccess`/`#fetchNpcs` sequencing (e.g. if `#fetchAccess` no longer stands fully alone).

### Step 3 — Verify `GenericClient#fetchIndex` / `CharacterClient#fetchNpcsAll` support both branches cleanly

Confirm both client methods can be called with `{ ...paginationParams, ...filterParams }` without behavior differences beyond params (e.g. whether `fetchIndex` already parses pagination headers the same way `fetchNpcsAll` + `#parsePagination` do). If `fetchIndex` already returns `{ data, pagination }` in the same normalized shape, prefer simplifying `#fetchNpcs` to a single code path per branch that reuses `fetchIndex` for the public case and `fetchNpcsAll` + `#parsePagination` for the DM case, matching current per-branch response handling — do not introduce a new abstraction beyond what's needed to remove the now-dead racing code.

## Files to Change

- `frontend/assets/js/components/resources/character/pages/controllers/GameNpcsController.js` — rework `#fetchAccess`/`#fetchNpcs` to resolve `can_edit` (facade-aware) first and fetch a single endpoint; remove dual-fetch/race logic (`#applyNpcsResult`, `#applyPublicNpcs`, `#applyAuthNpcs`, `#tryGetAuthNpcs`).
- `frontend/specs/assets/js/components/resources/character/pages/controllers/GameNpcsController/npcListFetchSpec.js` — replace dual-fetch-racing specs with single-endpoint-selection specs driven by `can_edit`, including a regression test for "View as" a player still hitting `npcs.json`.
- `frontend/specs/assets/js/components/resources/character/pages/controllers/GameNpcsController/canEditSpec.js`, `isPlayerSpec.js` — check for updates needed due to `#fetchAccess`/`#fetchNpcs` sequencing changes.

## CI Checks

- `frontend`: `yarn lint` (CI job: `frontend-checks`)
- `frontend`: `yarn coverage` (CI job: `jasmine`)

## Notes

- Do not touch `GameController#fetchNpcsPreview` (`frontend/assets/js/components/resources/game/pages/controllers/GameController.js`) — same bug pattern, explicitly out of scope per the issue.
- Do not touch `access.is_player`/`ensureGameAccess` usage — it is intentionally always real-identity and unrelated to this fix.
- Watch for the change in whether `npcs.json` (public/player branch) now also needs pagination params forwarded, since it becomes the sole request in the player-simulated case rather than a fallback alongside a richer `all.json` request.
