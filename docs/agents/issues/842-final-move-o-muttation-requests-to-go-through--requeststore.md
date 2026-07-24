# Issue: Final move of mutation requests to go through `RequestStore`

## Description
#830 introduced the `RequestStore` mutation migration path (PC edit, NPC edit, NPC new), and #841/#844/#847 extended it across treasures, game items, character-owned items, game/document creation, exchange modals, and photo uploads. The general approach, config shape, and testing pattern are documented in `docs/agents/migration/README.md` and are not re-derived here — this issue only covers the routes still listed under that document's "Not yet migrated" section.

This is the final batch: once it lands, every mutation route in the app goes through `RequestStore`, and `docs/agents/migration/README.md` (plus the `docs/agents/migration/` directory) is deleted as part of this PR, per that document's own "delete once every route is checked off" instruction.

## Problem
The remaining mutation routes still call their per-resource `Client` classes directly instead of going through `RequestStore`, duplicating URL/permission-resolution logic and leaving no way to purge `RequestStore`'s `GET` cache after they succeed. This batch also brings in three resources (`poll`, `task`, `staffUser`) that have never been registered in `resourceConfig.js` at all — unlike every resource migrated so far, which already had a `GET` entry from earlier work — so both their `GET` and mutation methods need config added together here.

`poll` specifically has a caching wrinkle none of the other resources have: `PollClient`'s read/write methods return per-viewer data (a poll's votes/permissions reflect the requester), so today they manually pass an `X-Skip-Cache: true` header to bypass the proxy's response cache (`BaseClient`'s automatic `X-Skip-Cache` handling — see `skipCacheSuffixes.js`/`skipCacheEndpoints.js` — already covers this for every `POST`/`PATCH`/`DELETE` unconditionally, and for `GET`/`PUT` whenever the path matches a configured static suffix, e.g. `/messages.json`/`/players.json` today):
- `fetchPollVotes` (`GET .../polls/:id/votes.json`) and `castPollVotes` (`PUT .../polls/:id/votes.json`) both end in the literal, non-parameterized suffix `/votes.json`, so adding that suffix to `skipCacheSuffixes.js` (mirroring the existing `/messages.json`/`/players.json` entries) covers both automatically, the same way `RequestStore`-dispatched calls already get the header for free today.
- `closePoll` (`PATCH .../polls/:id/close.json`) already gets the header automatically — `PATCH` is unconditionally covered by `BaseClient`.
- `fetchPoll` (`GET .../polls/:id.json`) is the one case with no static-suffix option, since the poll `id` is the path's own trailing dynamic segment right before `.json` — there's no existing generic "config says skip cache" mechanism for a case like this, only per-pathname/suffix matching.

(Note: `RequestStore`'s own in-memory cache, unlike the proxy's, is scoped to a single browser session/tab already carrying the logged-in user's own cookie — it does not need an identity-aware cache key the way the proxy-level `X-Skip-Cache` header does.)

## Expected Behavior
The following routes go through `RequestStore` (`ensure()` for reads it doesn't already handle, `mutate()`/`resolvePath()` for writes), resolving their URL/permission variant the same way already-migrated resources do, with `RequestStore.purge({ resource })` clearing that resource's settled `GET` cache on a successful mutation:

**Game Session** — `GameSessionClient.js` (existing `session` resource, mutation-only; `GET` already migrated)
- `/#/games/:game_slug/sessions/new` — `GameSessionNewController.js` → `createSession` (`POST /games/:game_slug/sessions.json`)
- `/#/games/:game_slug/sessions/:id/edit` — `GameSessionEditController.js` → `updateSession` (`PATCH /games/:game_slug/sessions/:id.json`)
- `/#/games/:game_slug/sessions/:id` (message post) — `SessionMessagesController.js` → `createMessage` (`POST /games/:game_slug/sessions/:id/messages.json`)
- `/#/games/:game_slug/sessions/:id` (poll proposal) — `GameSessionController.js` → `createSessionPoll` (`POST /games/:game_slug/sessions/:id/poll.json`)

**Poll** — `PollClient.js` (new `poll` resource, `GET` + mutations)
- `/#/games/:game_slug/polls/new` — `GamePollNewController.js` → `createPoll` (`POST /games/:game_slug/polls.json`)
- `/#/games/:game_slug/polls/:id` — `GamePollController.js` → `fetchPoll` (`GET .../polls/:id.json`), `fetchPollVotes` (`GET .../polls/:id/votes.json`), `castPollVotes` (`PUT .../polls/:id/votes.json`)
- `/#/games/:game_slug/polls` — `GamePollsController.js`/`OpenPollsWidgetController.js` → `fetchPolls` (`GET .../polls.json`); `PollCloseModalController.js` → `closePoll` (`PATCH .../polls/:id/close.json`)
- `fetchPoll`'s response stays uncached (no static-suffix skip-cache match is possible for a trailing dynamic id) — see Solution for how this is preserved without giving every resource a general-purpose "extra headers" escape hatch.

**Game Task** — `GameTaskClient.js` (new `task` resource, `GET` + mutations)
- `/#/games/:game_slug/tasks` — `GameTasksController.js` → `fetchTasks` (`GET /games/:game_slug/tasks.json`), `createTask` (`POST .../tasks.json`), `updateTask` (`PATCH .../tasks/:id.json`, covering both the edit form and the completed-flag toggle)

**Treasure (link existing)** — `TreasureClient.js` (existing `treasure` resource, new mutation entry)
- `/#/games/:game_slug/treasures` (Add Treasure modal) — `AddGameTreasureModalController.js` → `linkGameTreasure` (`POST /games/:game_slug/treasures/link.json`) — distinct from the already-migrated game-catalog create path (`POST /games/:game_slug/treasures.json`)

**Staff User** — `StaffUserClient.js` (new `staffUser` resource, `GET` + mutations)
- `/#/staff/users/:id/edit` — `StaffUserEditController.js` → `fetchUser` (`GET /staff/users/:id.json`), `updateUser` (`PATCH /staff/users/:id.json`)
- `/#/staff/users` — `StaffUsersController.js` → `fetchUsers` (`GET /staff/users.json`), and `handleGenerateRecoveryLink` → `fetchRecoveryLink` (`POST /staff/users/:id/recovery-link.json`) — despite its `fetch`-prefixed name this is a real mutation (creates/reuses a `PasswordResetToken` server-side); this route was originally listed as `/#/staff/users/:id` (show page) but the code confirms it's the users **list** page

All routes above keep their current permission gating (page-level `AccessStore.ensure*` redirects plus server-side enforcement) — this issue only changes how the HTTP call itself is dispatched, not who is allowed to reach it.

## Solution
Follow the approach already documented in `docs/agents/migration/README.md` (config shape, dispatch via `RequestStore.ensure`/`mutate`/`resolvePath`, purge behavior, spec pattern) rather than re-deriving it. Scope specific to this batch:

- Add `POST`/`PATCH`/`PUT` entries to `frontend/assets/js/utils/requests/config/sessionConfig.js` (existing file, currently `GET`-only).
- Add a new `link` entry (or equivalent key) to `frontend/assets/js/utils/requests/config/treasureConfig.js`'s existing `POST` block for `linkGameTreasure`.
- Create `pollConfig.js`, `taskConfig.js`, and `staffUserConfig.js` (each with both `GET` and mutation entries this time, since none of the three exist yet), and register `poll`, `task`, `staffUser` in `resourceConfig.js`'s `RESOURCES` map.
- Add `/votes.json` to `frontend/assets/js/client/config/skipCacheSuffixes.js`, mirroring the existing `/messages.json`/`/players.json` entries — this alone makes both `fetchPollVotes` (`GET`) and `castPollVotes` (`PUT`) skip the proxy cache automatically once dispatched through `RequestStore`/`RequestMutationClient`, matching `PollClient`'s current manual behavior with no extra plumbing. `closePoll` (`PATCH`) already gets the header for free (every `PATCH` does).
- For `fetchPoll` (`GET .../polls/:id.json`), whose trailing dynamic `id` rules out a static suffix: add a small, resource-config-level flag (e.g. a `skipCache: true` on that variant) that `RequestStore.ensure()`'s underlying `GET` client checks and forwards as the `X-Skip-Cache: true` header — a targeted extension for this one shape, not a general "pass arbitrary headers through" escape hatch.
- Update controllers (`GameSessionNewController.js`, `GameSessionEditController.js`, `SessionMessagesController.js`, `GameSessionController.js`, `GamePollNewController.js`, `GamePollController.js`, `GamePollsController.js`, `OpenPollsWidgetController.js`, `PollCloseModalController.js`, `GameTasksController.js`, `AddGameTreasureModalController.js`, `StaffUserEditController.js`, `StaffUsersController.js`) to call `RequestStore.ensure`/`mutate`/`resolvePath` instead of their current `Client` method, passing `variantName` explicitly wherever the caller already knows it from loaded permissions.
- Update specs for all the above controllers to `spyOn(RequestStore, 'ensure'/'mutate')` per the documented pattern, and remove/replace the corresponding per-`Client` spies.
- Update `docs/agents/migration/README.md`'s checklist to check off every remaining route, then delete that file and the `docs/agents/migration/` directory as part of this PR.

## Benefits
- Every mutation route in the app is dispatched the same way, closing out the migration started in #830.
- `RequestStore`'s `GET` cache can no longer go stale after any mutation, app-wide.
- The temporary migration doc and its directory can finally be deleted, removing a maintenance burden on every future issue that touched a mutation route.
