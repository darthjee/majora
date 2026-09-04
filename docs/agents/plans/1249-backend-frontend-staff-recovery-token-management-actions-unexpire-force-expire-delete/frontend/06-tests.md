# Tests

Add/extend Jasmine specs covering steps 01–05:

- `StaffUserRecoveryTokensControllerSpec.js` — extend with cases for `handleUnexpire`,
  `handleForceExpire`, `handleDelete`, and `refresh`: each mutation calling `RequestStore.mutate`
  with the right `quantityType`/`params`, a success response triggering `RequestStore.purge` +
  re-fetch, a non-ok/404 response setting `actionError` *and* still re-fetching, and a thrown
  error being caught the same way.
- `RecoveryTokenActionConfirmModalSpec.js` (new, mirroring `ClearCacheConfirmModalSpec.js`'s
  shape) — renders nothing when `show` is `false`; renders the right title/body/confirm-label for
  `action="delete"` vs `action="force-expire"`; `onConfirm`/`onCancel` wired to the right buttons.
- `StaffUserHelperSpec.js` — extend with cases for: action buttons appearing per row status
  (`unexpire` on expired/revoked, `force-expire` on valid, `delete` on every row); the panel-level
  generate button always present; the action-error alert appearing when `actionError` is `true`
  without hiding the table.
- `StaffUserSpec.js` — extend with a case wiring a row's force-expire/delete click through to
  opening `RecoveryTokenActionConfirmModal` with the right `action`/state, confirming calls the
  right controller method and closes the modal, and cancelling closes it without calling anything.

## Files to Change

- `frontend/specs/assets/js/components/resources/staff_user/pages/controllers/StaffUserRecoveryTokensControllerSpec.js`
- `frontend/specs/assets/js/components/resources/staff_user/pages/elements/RecoveryTokenActionConfirmModalSpec.js` (new)
- `frontend/specs/assets/js/components/resources/staff_user/pages/helpers/StaffUserHelperSpec.js`
- `frontend/specs/assets/js/components/resources/staff_user/pages/StaffUserSpec.js`
