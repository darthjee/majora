# Specs

Mirror the sibling files' Jasmine spec shapes exactly (see `StaffUserControllerSpec.js`, `StaffUserHelperSpec.js`, `StaffUserStatusBadgesSpec.js` for the patterns).

- **`RecoveryTokenStatusBadgesSpec.js`**: one `it` per status (`used`/`revoked`/`expired`/`valid`) asserting `{ variant, text }`; a precedence case (e.g. `used_at` **and** `invalidated_at` both set -> `'used'` wins; `invalidated_at` set on an already-past `expires_at` -> `'revoked'` wins) covering `computeStatus` directly.
- **`StaffUserRecoveryTokensControllerSpec.js`**: mirrors `StaffUserControllerSpec.js` — stub `RequestStore.ensure`, assert the panel's `setTokens`/`setLoading`/`setError` sequence on success, on a rejected promise, and on an empty array; assert the effect's cleanup (`mounted = false`) discards a late-resolving response, same as the existing controller specs' unmount assertions.
- **`StaffUserHelperSpec.js`** (extend the existing file): `#renderRecoveryTokenPanel` cases for loading, error, empty, and a populated table (asserting each row's status badge, `token_preview`, and the empty-state message when `tokens` is `[]`).
- **`StaffUserSpec.js`** (extend the existing file): asserts the page still renders the user detail block when the token fetch fails (independent-load requirement), and that `StaffUserRecoveryTokensController` is invoked with the resolved `user.id` only after the user itself has loaded.

## Files to Change

- `frontend/specs/assets/js/components/common/list_types/RecoveryTokenStatusBadgesSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_user/pages/controllers/StaffUserRecoveryTokensControllerSpec.js` — new.
- `frontend/specs/assets/js/components/resources/staff_user/pages/helpers/StaffUserHelperSpec.js` — extend.
- `frontend/specs/assets/js/components/resources/staff_user/pages/StaffUserSpec.js` — extend.
