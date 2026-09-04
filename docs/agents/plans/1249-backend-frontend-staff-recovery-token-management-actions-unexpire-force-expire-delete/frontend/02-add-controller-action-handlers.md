# Add action handlers to the tokens controller

Extend `StaffUserRecoveryTokensController` (currently only owns the mount-time fetch) with:

1. A private `#fetchTokens(userId, safeSet)` extracted from the existing `buildEffect` body, so
   both the mount effect and the new refresh path share one fetch implementation.
2. `refresh(userId)`: calls `RequestStore.purge({ resource: 'staffUser' })` then re-runs
   `#fetchTokens(userId, ...)` — the shared post-action refresh contract from
   [plan.md](../plan.md), also reusable by `StaffUser.jsx`'s panel-level "Generate recovery link"
   handler.
3. `handleUnexpire(userId, tokenId)`, `handleForceExpire(userId, tokenId)`,
   `handleDelete(userId, tokenId)`: each calls `RequestStore.mutate` with
   `resource: 'staffUser'`, the matching `method`/`quantityType` from
   [01-add-request-config-entries.md](01-add-request-config-entries.md), and
   `params: { id: userId, tokenId }`. On `response.ok`, call `this.refresh(userId)`. On a non-ok
   response (in particular 404 — the stale-list/concurrent-delete race) or a thrown error, set a
   new `actionError` flag (via a new `setActionError` setter passed into the constructor,
   analogous to `setError`) and *still* call `this.refresh(userId)` so the list catches up to
   reality either way, per the issue's stale-404 behavior. Follow
   `StaffUsersController.#mutateStatus`'s try/catch shape.

Constructor signature grows to `(setTokens, setLoading, setError, setActionError)`. `actionError`
is intentionally a separate flag from the existing `tokensError` (mount-load failure) — an action
failure must not blank the whole panel into `StaffUserHelper`'s full-panel error state; the table
stays visible and only a transient alert is shown (rendering handled in step 04). Clear
`actionError` back to `false` at the start of every `refresh()` call so a later successful action
dismisses a previous one's alert.

## Files to Change

- `frontend/assets/js/components/resources/staff_user/pages/controllers/StaffUserRecoveryTokensController.js` —
  add `#fetchTokens`, `refresh`, `handleUnexpire`, `handleForceExpire`, `handleDelete`, and the
  `setActionError` constructor param, per the shape above.
