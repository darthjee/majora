# StaffUserApiTokensController

Create `StaffUserApiTokensController`, a sibling of `StaffUserRecoveryTokensController` extending `BasePageController`, with its own state so a fetch failure never blanks the user details.

- Constructor setters: `setTokens`, `setLoading`, `setError`, `setNotice`. `notice` is `null`, `'token_gone'` or `'action_error'`, following `ApiTokensController`'s notice pattern rather than a boolean, because the panel needs both an info alert (404) and an error alert.
- `buildEffect(userId)`: the mounted-guarded load, as in the recovery controller.
- `#fetchTokens(userId, safeSet)`: `RequestStore.ensure({ componentName: 'StaffUserApiTokensController', resource: 'staffUser', quantityType: 'apiTokens', params: { id: userId } })`; non-array data becomes `[]`; failure sets `error`; always clears `loading`.
- `refresh(userId)`: `RequestStore.purge({ resource: 'staffUser' })`, then `#fetchTokens`. It must not clear a notice set by the revoke that triggered it.
- `revoke(userId, tokenId)`: clear the notice, then `RequestStore.mutate({ ..., method: 'DELETE', quantityType: 'deleteApiToken', params: { id: userId, tokenId } })`.
  - `response.ok` → refresh.
  - `response.status === 404` → notice `'token_gone'`, then refresh.
  - Any other status, or a thrown error → notice `'action_error'`, then refresh (the table stays visible).

Specs, mirroring the recovery controller's spec: load success, non-array data, load failure, revoke success (purge + ensure again), revoke 404 (`token_gone` + refresh), revoke non-OK (`action_error`), revoke throwing (`action_error`), and the unmount guard.

## Files to Change

- `frontend/assets/js/components/resources/staff_user/pages/controllers/StaffUserApiTokensController.js` — new.
- `frontend/specs/assets/js/components/resources/staff_user/pages/controllers/StaffUserApiTokensControllerSpec.js` — new, next to the recovery controller's spec.
