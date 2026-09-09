# Add CrawlerDebugCardController

Create
`elements/controllers/CrawlerDebugCardController.js` as a copy of
`MemoryCacheCardController.js` with these differences:

- Constructor signature `(setCounts, setStatus, setLoading, setError, client = null)`
  with `this.client = client ?? new CrawlerClient()` (import `CrawlerClient`
  from `../../../../../../client/CrawlerClient.js`). Keep `AuthStorage` import.
- `buildEffect()` — unchanged (mount-guarded single `#fetchSummary` call).
- `refresh()` — unchanged.
- `#fetchSummary(safeSet)` — unchanged structure; on `response.ok` do
  `safeSet(this.setCounts, await response.json())` (the counts object). On
  `!ok` / throw → `safeSet(this.setError, true)`; `finally` →
  `safeSet(this.setLoading, false)`.
- Rename `clearCache()` → `clearEmissions()`: sets `status='loading'`, reads
  `AuthStorage.getToken()`, `await this.client.clearEmissions(token)`, on
  `!response.ok` → `status='error'` and return, else `status='success'` then
  `await this.refresh()`; `catch` → `status='error'`.
- **Omit** `logData()` entirely (memory-card-only console.debug slot; the
  crawler card has no clickable data area).

Update the class JSDoc to describe the crawler summary rather than the cache
summary.

Specs — create the directory
`specs/.../elements/controllers/CrawlerDebugCardController/` mirroring
`MemoryCacheCardController/`, with:

- `support.js` — a `buildContext()` helper exporting the four setter spies and
  a stub `CrawlerClient` (following `MemoryCacheCardController/support.js`).
- `buildEffectSpec.js` — success sets counts + clears loading, no error; `!ok`
  sets error + clears loading; reject sets error + clears loading; no state
  update after the cleanup runs (unmount).
- `clearEmissionsSpec.js` — `loading`→`success` and refreshes counts on ok;
  `error` and no refresh on `!ok`; `error` on reject.
- `refreshSpec.js` — re-fetches and applies the counts.

No `logDataSpec.js` (method removed).

## Files to Change

- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/controllers/CrawlerDebugCardController.js` — new controller.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/controllers/CrawlerDebugCardController/support.js` — new.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/controllers/CrawlerDebugCardController/buildEffectSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/controllers/CrawlerDebugCardController/clearEmissionsSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_dashboard/pages/elements/controllers/CrawlerDebugCardController/refreshSpec.js` — new.
