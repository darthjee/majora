# Render row actions and the generate button

Extend `StaffUserHelper`:

- `#renderRecoveryTokenPanel`/`#renderTokenTable` gain a `handlers` parameter
  (`{ onUnexpire, onForceExpirePrompt, onDeletePrompt, onGenerateRecoveryLink }`) and `tokensState`
  gains `actionError` (from step 02's new controller state).
- Add an actions column (new `staff_user_page.recovery_token_actions_column` header) to
  `#renderTokenTable`. Per row, compute the status via `RecoveryTokenStatusBadges.computeStatus`
  (already imported) and render:
  - `unexpire` button (one-click, calls `handlers.onUnexpire(token.id)` directly) when status is
    `expired` or `revoked`.
  - `force-expire` button (calls `handlers.onForceExpirePrompt(token.id)`, opening the confirm
    modal — not a direct mutation) when status is `valid`.
  - `delete` button (calls `handlers.onDeletePrompt(token.id)`, also confirm-gated) on every row.
- Add a panel-level "Generate recovery link" button (one-click, calls
  `handlers.onGenerateRecoveryLink()`) above or below the table, using a new
  `staff_user_page.recovery_token_generate_button` key — independent of any row.
- When `actionError` is `true`, render a dismissible-looking alert (reuse `ErrorAlert`, new
  `staff_user_page.recovery_token_action_error` key) above the table, *without* hiding the table
  itself — this is the "stale list / concurrent action" error path, distinct from the existing
  full-panel `tokensError` state.

Do not render `RecoveryTokenActionConfirmModal` from this helper — per the
`ClearCacheConfirmModal`/`MemoryCacheCard.jsx` precedent, the modal and its `pendingAction` state
live in the page component (`StaffUser.jsx`, step 05), rendered as a sibling to this helper's
output, not inside it.

## Files to Change

- `frontend/assets/js/components/resources/staff_user/pages/helpers/StaffUserHelper.jsx` — extend
  `#renderRecoveryTokenPanel`/`#renderTokenTable` per the shape above, add the generate button and
  the action-error alert.
