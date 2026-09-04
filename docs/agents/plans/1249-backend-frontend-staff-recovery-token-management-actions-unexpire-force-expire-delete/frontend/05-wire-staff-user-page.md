# Wire the page together

In `StaffUser.jsx`, following the `MemoryCacheCard.jsx`/`ClearCacheConfirmModal` precedent:

- Add `const [actionError, setActionError] = useState(false)` and pass `setActionError` into
  `StaffUserRecoveryTokensController`'s constructor (grown in step 02).
- Add `const [pendingAction, setPendingAction] = useState(null)` — `null` or
  `{ type: 'delete' | 'force-expire', tokenId }`.
- Build handlers passed into `StaffUserHelper.render`'s new `handlers` argument:
  - `onUnexpire: (tokenId) => tokensController.handleUnexpire(user.id, tokenId)` (one-click).
  - `onForceExpirePrompt: (tokenId) => setPendingAction({ type: 'force-expire', tokenId })`.
  - `onDeletePrompt: (tokenId) => setPendingAction({ type: 'delete', tokenId })`.
  - `onGenerateRecoveryLink: async () => { await RequestStore.mutate({ resource: 'staffUser', method: 'POST', quantityType: 'recoveryLink', params: { id: user.id } }); tokensController.refresh(user.id); }`
    (fire-and-refresh; ignore the response body — the panel doesn't display the raw link, only the
    refreshed token list).
- Render `<RecoveryTokenActionConfirmModal>` as a sibling to `StaffUserHelper.render(...)`'s
  output, `show={pendingAction !== null}`, `action={pendingAction?.type}`,
  `onCancel={() => setPendingAction(null)}`, and `onConfirm` dispatching to
  `tokensController.handleForceExpire`/`handleDelete` based on `pendingAction.type` before clearing
  `pendingAction` back to `null`.
- Pass `{ tokens, tokensLoading, tokensError, actionError }` as `tokensState` (extends the existing
  shape with the new `actionError` flag from step 02/04).

## Files to Change

- `frontend/assets/js/components/resources/staff_user/pages/StaffUser.jsx` — add the two new state
  slots, the handlers object, and the `RecoveryTokenActionConfirmModal` render, per the shape
  above.
