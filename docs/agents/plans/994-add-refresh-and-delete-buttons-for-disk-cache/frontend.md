# Frontend Plan: Add refresh and delete buttons for disk cache

Main plan: [plan.md](plan.md)

## Shared contracts

This agent consumes the endpoint the proxy agent produces, and consumes the translation keys the
translator agent produces:

- Calls `DELETE /staff/cache/disk.json` — treat any non-2xx response as a failure by checking
  `response.ok` only (do not depend on a JSON error body being present, since the 403 case
  returns one but other failure paths may not).
- Renders `Translator.t('clear_cache_confirm_modal.title')` / `...body` / `...cancel` /
  `...confirm` (top-level key, matching `delete_photo_confirm_modal.*`'s convention — not nested
  under `staff_dashboard`) — these keys must exist in both `en.yaml` and `pt.yaml` before this
  code is exercised in CI (`check_i18n` fails otherwise).

## Context

Existing pair of dashboard cards under
`frontend/assets/js/components/resources/staff_dashboard/pages/elements/`:

- `MemoryCacheCard.jsx` / `controllers/MemoryCacheCardController.js` /
  `helpers/MemoryCacheCardHelper.jsx` — already has Refresh + Clear Cache, this is the parity
  target.
- `DiskCacheCard.jsx` / `controllers/DiskCacheCardController.js` /
  `helpers/DiskCacheCardHelper.jsx` — currently read-only display with a 60s auto-retry-on-failure
  timer, no actions.
- `client/StaffCacheClient.js` — HTTP client both controllers use, extends `BaseClient`.
- `CardActions.jsx` — generic action-button row (icon + tooltip + onClick + disabled), already
  reused by `MemoryCacheCardHelper`; `DiskCacheCardHelper` needs to start using it too.
- `utils/ui/Icons.js` — flat map of bootstrap-icon classnames; currently has no dedicated
  "refresh" icon, and `MemoryCacheCardHelper` mistakenly uses `Icons.databaseFillDash` for *both*
  its Clear Cache and Refresh buttons (this issue also fixes that).
- `character/pages/elements/DeletePhotoConfirmModal.jsx` +
  `helpers/DeletePhotoConfirmModalHelper.jsx` — the existing confirm-modal pattern to follow
  (`react-bootstrap` `Modal`, `show`/`onConfirm`/`onCancel` props, own scoped translation keys).
  `DashboardCard.jsx` has no slot for a modal — render it as a sibling of the card's returned
  markup (a `Modal` from `react-bootstrap` portals to `document.body` regardless of where it's
  mounted in the tree, so this needs no `DashboardCard` changes).

## Implementation Steps

### Step 1 — Icons

Add to `Icons.js`: `arrowClockwise: 'bi-arrow-clockwise'`. `Icons.trash` (`bi-trash-fill`) already
exists and gets reused for Clear Cache.

### Step 2 — `StaffCacheClient.clearDiskCache`

Add, mirroring `clearCache()`:

```js
clearDiskCache(token) {
  return this.request('/staff/cache/disk.json', {
    method: 'DELETE',
    headers: this.buildHeaders(token),
  });
}
```

### Step 3 — Shared `ClearCacheConfirmModal`

New `elements/ClearCacheConfirmModal.jsx` + `elements/helpers/ClearCacheConfirmModalHelper.jsx`,
following `DeletePhotoConfirmModal`'s shape exactly, minus the `photo` prop (nothing card-specific
to pass through — body copy is generic):

```jsx
// ClearCacheConfirmModal.jsx
export default function ClearCacheConfirmModal({ show, onConfirm, onCancel }) {
  return ClearCacheConfirmModalHelper.render(show, { onConfirm, onCancel });
}
```

Helper renders a `react-bootstrap` `Modal` with `Modal.Title`/`Modal.Body` from the top-level
`clear_cache_confirm_modal.title`/`.body` keys, and Cancel/Confirm buttons from `.cancel`/
`.confirm` (same button classes as `DeletePhotoConfirmModalHelper`: `btn-secondary` for cancel,
`btn-danger` for confirm).

### Step 4 — `DiskCacheCardController`: `clearCache()` and `refresh()`

Bring the controller from read-only to Memory Cache's shape, plus the timer-cancellation Disk
Cache specifically needs:

- Constructor gains a `setStatus` setter (new 3rd param, matching `MemoryCacheCardController`'s
  ordering as closely as possible: `(setSize, setStatus, setLoading, setError, client)`).
- `buildEffect()`: keep the existing mount-fetch-with-retry-timer logic, but track the pending
  `setTimeout` handle on `this` (e.g. `this.retryTimer`) instead of a closure-local `timer`, so
  `refresh()` (added below, called from outside the effect) can clear it too. Clearing on unmount
  keeps working exactly as today via the effect's cleanup function.
- New public `async refresh()`: clears `this.retryTimer` if set, then re-runs the same fetch used
  by `buildEffect()` (extract the mount fetch into a private method both call, e.g.
  `#fetchSize(safeSet, scheduleRetry)` — already exists, just needs to be callable from both
  places with a fresh "mounted" gate since `refresh()` isn't inside the effect's closure; simplest
  is an always-true `safeSet` for the manual-refresh path, same as
  `MemoryCacheCardController.refresh()` does via `this.#buildSafeSetter(() => true)`).
- New public `async clearCache()`, mirroring `MemoryCacheCardController.clearCache()` exactly:
  `setStatus('loading')` → call `this.client.clearDiskCache(token)` → `setStatus('error')` and
  return if `!response.ok` → otherwise `setStatus('success')` then `await this.refresh()`; catch
  block sets `setStatus('error')`.
- Per the issue's decided design: `refresh()` itself does **not** touch `status` (silent update,
  no "Refreshed" message) — only `clearCache()` does.

### Step 5 — `DiskCacheCard.jsx`

Add `status` and `showConfirm` state (`useState('idle')` / `useState(false)`), pass `setStatus`
into the controller constructor, and render the modal as a sibling:

```jsx
return (
  <>
    {DiskCacheCardHelper.render(
      { size, status, loading, error },
      {
        onClearCache: () => setShowConfirm(true),
        onRefresh: () => controller.refresh(),
      },
    )}
    <ClearCacheConfirmModal
      show={showConfirm}
      onConfirm={() => { setShowConfirm(false); controller.clearCache(); }}
      onCancel={() => setShowConfirm(false)}
    />
  </>
);
```

### Step 6 — `DiskCacheCardHelper.jsx`

Add a `CardActions` row (Clear Cache → `Icons.trash` + `clear_cache_tooltip`; Refresh →
`Icons.arrowClockwise` + `refresh_tooltip`; both `disabled` while `state.status === 'loading'`,
mirroring `MemoryCacheCardHelper`) and the success/error feedback line below the card (same
`clear_cache_success`/`clear_cache_error` keys and markup `MemoryCacheCardHelper` already uses —
extract into `#buildActions`/`#renderFeedback` private static methods matching
`MemoryCacheCardHelper`'s structure).

### Step 7 — Retrofit `MemoryCacheCard.jsx` / `MemoryCacheCardHelper.jsx` with the confirm step

- `MemoryCacheCard.jsx`: add `showConfirm` state; change the `onClearCache` handler passed to the
  helper from `() => controller.clearCache()` to `() => setShowConfirm(true)`; render
  `ClearCacheConfirmModal` as a sibling the same way as Step 5, with its `onConfirm` calling
  `controller.clearCache()`.
- `MemoryCacheCardHelper.jsx`: fix the icon bug — Clear Cache action uses `Icons.trash` instead of
  `Icons.databaseFillDash`; Refresh action uses `Icons.arrowClockwise` instead of
  `Icons.databaseFillDash`. No other changes — `MemoryCacheCardController` itself is untouched
  (the confirm gate is purely a card-level concern; `clearCache()` still fires immediately once
  called, same as today).

## Files to Change

- `frontend/assets/js/utils/ui/Icons.js` — add `arrowClockwise`.
- `frontend/assets/js/client/StaffCacheClient.js` — add `clearDiskCache(token)`.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/ClearCacheConfirmModal.jsx` — new.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/helpers/ClearCacheConfirmModalHelper.jsx` — new.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/controllers/DiskCacheCardController.js` — add `status`, `clearCache()`, `refresh()`, timer-cancellation.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/DiskCacheCard.jsx` — add `status`/`showConfirm` state, wire handlers, render modal.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/helpers/DiskCacheCardHelper.jsx` — add `CardActions` + feedback line.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/MemoryCacheCard.jsx` — add `showConfirm` state, wire modal.
- `frontend/assets/js/components/resources/staff_dashboard/pages/elements/helpers/MemoryCacheCardHelper.jsx` — fix icons (`trash`/`arrowClockwise`).
- Specs (new, mirroring existing directory-per-method structure under `frontend/specs/assets/js/...`):
  - `client/StaffCacheClient/clearDiskCacheSpec.js`
  - `components/.../elements/ClearCacheConfirmModalSpec.js` +
    `helpers/ClearCacheConfirmModalHelperSpec.js`
  - `components/.../controllers/DiskCacheCardController/clearCacheSpec.js`,
    `refreshSpec.js` (new files; `buildEffectSpec.js` gets updated for the timer-handle-on-`this`
    change)
  - `components/.../DiskCacheCardSpec.js`, `helpers/DiskCacheCardHelperSpec.js` — updated for the
    new actions/state
  - `components/.../MemoryCacheCardSpec.js`, `helpers/MemoryCacheCardHelperSpec.js` — updated for
    the confirm-modal gating and icon fix

## CI Checks

- `frontend`: `npm run coverage` (or `npm test`) (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run check_i18n` (CI job: `frontend-checks`) — will fail until the translator
  agent's keys land; don't merge frontend changes ahead of translations.

## Notes

- `MemoryCacheCardController` needs no changes at all — the confirm step is entirely a
  `MemoryCacheCard.jsx`-level concern (open modal on click, call the existing `clearCache()` only
  once confirmed).
- Keep `DiskCacheCardController`'s constructor parameter order consistent with
  `MemoryCacheCardController`'s where practical, since both are called by their respective Card
  components and by tests using the same `support.js`-style `buildContext()` helper pattern.
