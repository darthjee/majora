# Plan: Final move of mutation requests to go through `RequestStore`

Issue: [842-final-move-o-muttation-requests-to-go-through--requeststore.md](../issues/842-final-move-o-muttation-requests-to-go-through--requeststore.md)

## Overview
This is the final batch of the `RequestStore` mutation migration (started in #830, extended in #841/#844/#847). It migrates the last remaining mutation routes — Game Session, Poll, Game Task, Treasure-link, and Staff User — onto `RequestStore.mutate`/`RequestStore.resolvePath`, and additionally introduces `poll`, `task`, and `staffUser` as new `resourceConfig` resources with full `GET` entries too (unlike every prior batch, none of these three had ever been registered at all). Once merged, `docs/agents/migration/README.md` and its directory are deleted. All work is inside `frontend/`, so there is no agent split — a single `frontend` agent implements this plan end to end.

## Context
The general migration approach (config shape keyed by HTTP method then quantity-type, dispatch via `RequestStore.mutate({ componentName, resource, method, quantityType, params, body, variantName })`, cache purge via `RequestStore.purge({ resource })`, and the `spyOn(RequestStore, 'mutate'/'ensure')` spec pattern) is documented in `docs/agents/migration/README.md` and must not be re-derived — follow it as-is.

Two wrinkles specific to this batch (see the issue's Problem section for the full reasoning):
- `poll`/`task`/`staffUser` need brand-new config files with both `GET` and mutation entries (no existing `GET` entry to build on, unlike `session`/`treasure`).
- `PollClient`'s current manual `X-Skip-Cache: true` header (needed because poll data is per-viewer) can mostly be replaced by adding `/votes.json` to the existing static `frontend/assets/js/client/config/skipCacheSuffixes.js` set (covers `fetchPollVotes` GET and `castPollVotes` PUT automatically, `BaseClient` already covers every `PATCH`/`POST`/`DELETE` unconditionally). Only `fetchPoll`'s single-poll-detail `GET` (`.../polls/:id.json`, dynamic trailing id) has no static-suffix option and needs a small, resource-config-level `skipCache` flag that the `GET` dispatch path checks and forwards as the header.

## Implementation Steps

### Step 1 — Session mutations (existing resource)
Add `POST`/`PATCH`/`PUT` entries to `frontend/assets/js/utils/requests/config/sessionConfig.js` (currently `GET.single` only):
- `POST.collection` → create (`/games/:game_slug/sessions.json`)
- `PATCH.single` → update (`/games/:game_slug/sessions/:id.json`)
- `POST` entries for message-post (`/games/:game_slug/sessions/:id/messages.json`) and poll-proposal-create (`/games/:game_slug/sessions/:id/poll.json`) — these aren't "session" CRUD in the strict sense; follow `resourceConfig`'s existing precedent for sub-resource actions (see `treasureConfig.js`'s `acquire`/`buy`/`remove`/`sell`/`link`-style keys) rather than forcing them into `single`/`collection`.

Update controllers to dispatch through `RequestStore` instead of `GameSessionClient`:
- `GameSessionNewController.js` → `RequestStore.mutate` instead of `createSession`
- `GameSessionEditController.js` → `RequestStore.mutate` instead of `updateSession` (this controller already uses `RequestStore.ensure` for its `GET`, so the permission-resolution wiring is already in place)
- `SessionMessagesController.js` → `RequestStore.mutate` instead of `createMessage`
- `GameSessionController.js` → `RequestStore.mutate` instead of `createSessionPoll` (`CreateSessionPollModalController.js` itself has no client call to change — it's pure UI state)

### Step 2 — New `poll` resource (GET + mutations)
Create `frontend/assets/js/utils/requests/config/pollConfig.js` and register `poll` in `resourceConfig.js`'s `RESOURCES` map:
- `GET` entries for `fetchPolls` (`/games/:game_slug/polls.json`), `fetchPoll` (`/games/:game_slug/polls/:id.json` — mark with the new `skipCache` flag from Step 4), `fetchPollVotes` (`/games/:game_slug/polls/:id/votes.json`)
- `POST` for `createPoll` (`/games/:game_slug/polls.json`)
- `PUT` for `castPollVotes` (`/games/:game_slug/polls/:id/votes.json`)
- `PATCH` for `closePoll` (`/games/:game_slug/polls/:id/close.json`)

Update controllers:
- `GamePollNewController.js` → `RequestStore.mutate` instead of `createPoll`
- `GamePollController.js` → `RequestStore.ensure`/`mutate` instead of `fetchPoll`/`fetchPollVotes`/`castPollVotes`
- `GamePollsController.js`, `OpenPollsWidgetController.js` → `RequestStore.ensure` instead of `fetchPolls`
- `PollCloseModalController.js` → `RequestStore.mutate` instead of `closePoll`

### Step 3 — New `task` resource (GET + mutations)
Create `frontend/assets/js/utils/requests/config/taskConfig.js` and register `task` in `resourceConfig.js`:
- `GET.collection` for `fetchTasks` (`/games/:game_slug/tasks.json`)
- `POST.collection` for `createTask`
- `PATCH.single` for `updateTask` (covers both the edit form and the completed-flag toggle in `GameTasksController.js`)

Update `GameTasksController.js` to dispatch all three through `RequestStore` instead of `GameTaskClient`.

### Step 4 — New `staffUser` resource (GET + mutations)
Create `frontend/assets/js/utils/requests/config/staffUserConfig.js` and register `staffUser` in `resourceConfig.js`:
- `GET.collection` for `fetchUsers` (`/staff/users.json`), `GET.single` for `fetchUser` (`/staff/users/:id.json`)
- `PATCH.single` for `updateUser`
- A distinct entry (e.g. `POST.recoveryLink`) for `fetchRecoveryLink` (`/staff/users/:id/recovery-link.json`) — despite the `fetch`-prefixed name, this is a real mutation (creates/reuses a `PasswordResetToken` server-side)

Update controllers:
- `StaffUserEditController.js` → `RequestStore.ensure`/`mutate` instead of `fetchUser`/`updateUser`
- `StaffUsersController.js` → `RequestStore.ensure` for `fetchUsers`, `RequestStore.mutate` for `handleGenerateRecoveryLink`'s `fetchRecoveryLink` call

### Step 5 — Treasure-link mutation (existing resource)
Add a new `link` entry to `frontend/assets/js/utils/requests/config/treasureConfig.js`'s existing `POST` block (`/games/:game_slug/treasures/link.json`, `GameEditPermission`/DM-only per the backend), distinct from the already-migrated game-catalog create path. Update `AddGameTreasureModalController.js`'s `link` method to call `RequestStore.mutate` instead of `TreasureClient#linkGameTreasure`.

### Step 6 — Skip-cache handling for poll
- Add `/votes.json` to `frontend/assets/js/client/config/skipCacheSuffixes.js`, mirroring the existing `/messages.json`/`/players.json` entries (each with a one-line comment on why, following that file's existing convention).
- Add a `skipCache: true` flag on `pollConfig.js`'s `fetchPoll` `GET` variant, and extend whichever client `RequestStore.ensure()` dispatches `GET` requests through (check `RequestClient.js`/`Request.js`) to check that flag and forward `X-Skip-Cache: true` — scoped narrowly to this one config-driven case, not a general "arbitrary extra headers" mechanism.

### Step 7 — Update specs
For every controller touched above, replace `spyOn(<Client>.prototype, '<method>')` with `spyOn(RequestStore, 'ensure')`/`spyOn(RequestStore, 'mutate')` per `docs/agents/migration/README.md`'s documented spec pattern (plain object stand-in for `Response`, asserting full call args verbatim; bare `spyOn(RequestStore, 'purge')` asserting it's called with the right `{ resource }` on success and not on failure). Remove the now-unused `Client` imports/mocks from each spec. Several of these controllers have their specs split across a directory of files (e.g. `GameSessionEditController/`, `GamePollNewController/`, `StaffUsersController/`) rather than one flat `*Spec.js` — update every file in the relevant directory, not just one.

### Step 8 — Close out the migration doc
Update `docs/agents/migration/README.md`'s checklist to check off every route this issue migrates, confirm nothing remains under "Not yet migrated", then delete `docs/agents/migration/README.md` and the `docs/agents/migration/` directory as part of this same PR.

## Files to Change
- `frontend/assets/js/utils/requests/config/sessionConfig.js` — add mutation entries
- `frontend/assets/js/utils/requests/config/treasureConfig.js` — add `link` entry
- `frontend/assets/js/utils/requests/config/pollConfig.js` — new file
- `frontend/assets/js/utils/requests/config/taskConfig.js` — new file
- `frontend/assets/js/utils/requests/config/staffUserConfig.js` — new file
- `frontend/assets/js/utils/requests/resourceConfig.js` — register `poll`, `task`, `staffUser`
- `frontend/assets/js/client/config/skipCacheSuffixes.js` — add `/votes.json`
- `frontend/assets/js/utils/requests/RequestStore.js` and/or `RequestClient.js`/`Request.js` — support the new `skipCache` config flag for `GET`
- `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionNewController.js`
- `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionEditController.js`
- `frontend/assets/js/components/resources/game_session/pages/controllers/SessionMessagesController.js`
- `frontend/assets/js/components/resources/game_session/pages/controllers/GameSessionController.js`
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollNewController.js`
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollController.js`
- `frontend/assets/js/components/resources/game/pages/controllers/GamePollsController.js`
- `frontend/assets/js/components/resources/game/pages/elements/controllers/OpenPollsWidgetController.js`
- `frontend/assets/js/components/resources/game/pages/elements/controllers/PollCloseModalController.js`
- `frontend/assets/js/components/resources/game/pages/controllers/GameTasksController.js`
- `frontend/assets/js/components/resources/treasure/pages/elements/controllers/AddGameTreasureModalController.js`
- `frontend/assets/js/components/resources/staff_user/pages/controllers/StaffUserEditController.js`
- `frontend/assets/js/components/resources/staff_user/pages/controllers/StaffUsersController.js`
- Corresponding spec files/directories for every controller above
- `docs/agents/migration/README.md` — checklist update, then delete (with its directory)

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — should be a no-op here, but the migration doc's deletion is a good moment to confirm no orphaned i18n keys
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- `GameSessionClient`, `PollClient`, `GameTaskClient`, `StaffUserClient` keep their `GET` methods that remain outside `RequestStore` scope where applicable (none identified here — all listed `GET` methods are migrated) — double check no other caller of these clients' now-migrated methods was missed (e.g. any other component still calling `TreasureClient#linkGameTreasure` directly).
- The exact shape of `resourceConfig`'s sub-resource keys for session message-post/poll-create (Step 1) and staff-user recovery-link (Step 4) has no single established precedent — `treasureConfig.js`'s `acquire`/`buy`/`remove`/`sell`/`link` keys are the closest existing pattern to follow, but the frontend agent should use judgment on naming.
- Confirm during implementation whether `RequestPermissionResolvers.js` needs any resource-specific additions for the three new resources, or whether its existing generic resolution already covers them.