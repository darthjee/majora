# API tokens panel and page wiring

**Helper.** Create `StaffUserApiTokensHelper.jsx` in `staff_user/pages/helpers/` with a static `render({ tokens, loading, error, notice }, { onRevokePrompt })`:

- `<div className="mt-4">` with an `<h2>` of `staff_user_page.api_tokens_title`;
- a notice alert above the body: `token_gone` → an info alert with `api_tokens_page.token_gone`, `action_error` → `ErrorAlert` with `staff_user_page.api_tokens_action_error` (reuse whatever info-alert element the owner page uses for `token_gone`);
- the body: `LoadingMessage` (`api_tokens_loading`), `ErrorAlert` (`api_tokens_error`), the empty paragraph (`api_tokens_empty`), or the table;
- the table: one `<th>` per shared column (`api_tokens_page.col_<column>`, in the owner list's column order) plus `staff_user_page.api_tokens_actions_column`; each cell from `ApiTokenCellsHelper.renderName/renderPrefix/renderScopes/renderGames/renderExpires/renderLastUsed/renderCreated/renderStatus`; the actions cell a single `btn btn-outline-danger btn-sm` button with `api_tokens_page.revoke` calling `onRevokePrompt(token)`. No rename, no create, no "Revoke all".

In `StaffUserHelper.render`, add a fourth argument `apiTokensPanel` (`{ state, handlers }`) and render `StaffUserApiTokensHelper.render(...)` right after `#renderRecoveryTokenPanel`, before the edit action. Update the JSDoc.

**Page.** In `StaffUser.jsx`:

- add state `apiTokens`, `apiTokensLoading` (initially `true`), `apiTokensError`, `apiTokensNotice` and `pendingApiToken` (the token being revoked, or `null`);
- build `StaffUserApiTokensController` with `useMemo`, and start its effect under the same `loading || error || !user` guard as the recovery panel;
- render `<ApiTokenRevokeConfirmModal show={pendingApiToken !== null} tokenName={pendingApiToken?.name} ownerName={user.name} onConfirm={...} onCancel={() => setPendingApiToken(null)} />`; on confirm, clear `pendingApiToken` and call `apiTokensController.revoke(user.id, token.id)`.

Keep `StaffUser.jsx` within ESLint's complexity and length limits; if it grows too far, move the API-token state into a small `useStaffUserApiTokens(user)` hook next to the page.

**Specs:**

- `StaffUserApiTokensHelper` loading, error, empty and table states; the cells rendered through `ApiTokenCellsHelper`; Revoke calling `onRevokePrompt`; both notices; no rename or create controls;
- `StaffUserHelper` renders the panel below the recovery-token panel;
- `StaffUser` Revoke → modal with the token and owner names → confirm calls the controller → cancel does not; the panel is not rendered while the user is loading or failed (the non-staff redirect path).

## Files to Change

- `frontend/assets/js/components/resources/staff_user/pages/helpers/StaffUserApiTokensHelper.jsx` — new panel helper.
- `frontend/assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx` — render the panel; JSDoc.
- `frontend/assets/js/components/resources/staff_user/pages/StaffUser.jsx` — state, controller, revoke modal.
- The matching specs under `frontend/specs/` (new `StaffUserApiTokensHelperSpec`, updated `StaffUserHelperSpec` and `StaffUserSpec`).
