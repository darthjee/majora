# Page controller: drain-then-poll feed

`StaffCrawlerController` owns the access gate, the fetch/cursor logic, and
selection — no DOM/scroll concerns (those live in step 04's JSX component,
mirroring `DocumentPagesBoxController`/`DocumentPagesBox`'s split of
fetch-logic-in-controller vs. refs-and-observers-in-component).

## Files to Change

- `frontend/assets/js/components/resources/crawler/pages/controllers/StaffCrawlerController.js`
  — new class extending `BasePageController`.
  - Constructor: `(setLoading, setError, setEmissions, setSelectedId, client = new CrawlerClient())`
    — same `setLoading`/`setError` shape as `StaffDashboardController`.
  - `buildEffect()` — same access-gate shape as
    `StaffDashboardController#buildEffect`: calls
    `AccessStore.ensureStaffOrSuperUser()`, redirects to `/` via
    `this.redirectTo('/')` when not allowed, otherwise clears `loading` and
    kicks off `this.startFeed()`. Returns the effect's own cleanup, which
    must call `this.stopFeed()` (via a private `#stopped` flag or similar) so
    an in-flight drain/poll doesn't keep setting state after unmount —
    matches `buildSafeSetter`'s `mounted` guard pattern used elsewhere in this
    controller family.
  - `startFeed()` — drives the drain phase: repeatedly calls
    `this.client.fetchEmissions(lastId, token)` (starting with `lastId`
    `undefined`), appending each page's records to `setEmissions` (functional
    update, appending to the previous array) and advancing an internal
    `lastId` to the newest page's last record's `id`, for as long as a
    returned page has exactly `PAGE_SIZE` (50) records (mirror the backend's
    `CrawlerDebugEmissionPaginator.PAGE_SIZE`, hoisted as a local constant
    rather than imported cross-language). Once a page comes back with fewer
    than 50 records, stop draining and call `this.#startPolling()`.
  - `#startPolling()` (private) — `setInterval` at a 10-second interval
    (10000 ms — from the discuss-issue dialogue's poll-interval decision),
    re-running the same `fetchEmissions(lastId, token)` call and appending any
    new records the same way. Never advances `lastId` when a poll tick
    returns an empty array. Store the interval id on the instance so
    `stopFeed()` can `clearInterval` it.
  - `stopFeed()` — clears the polling interval if running; safe to call
    repeatedly (mirrors `AuthorizationRequestPoller#stop`'s idempotency).
  - `selectEmission(id)` — calls `setSelectedId(id)`. Trivial, but keeps
    `StaffCrawler.jsx` free of inline state-setter wiring, consistent with
    this controller family's style.
  - On any fetch rejection (network error) during drain or poll, catch and
    call `setError(...)` once via `Noop`-style catch, without stopping a
    still-running poll interval — a transient failure should not kill the
    live feed permanently (same spirit as `AuthorizationRequestPoller`'s
    `'retrying'` status, simplified here to a single error message since this
    is a low-traffic internal debug tool).

## Notes

- Auth token: read via `AuthStorage.getToken()` at call time (same as
  `SessionMessagesController`), not cached on the instance.
- No `RequestStore` involvement — this is a plain `GET`-only read loop, same
  category as `SessionMessagesController#loadFirstPage`/`#loadMore`.
