# Build the action confirmation modal

Add a new `RecoveryTokenActionConfirmModal` component (+ helper), following
`ClearCacheConfirmModal`/`ClearCacheConfirmModalHelper`'s exact shell shape (a `react-bootstrap`
`Modal` with header/body/footer, `show`/`onHide` wired to `onCancel`, a secondary "cancel" button
and a danger "confirm" button) but parameterized by which action it's confirming, since it serves
both `delete` and `force-expire`:

```jsx
// RecoveryTokenActionConfirmModal.jsx
export default function RecoveryTokenActionConfirmModal({ show, action, onConfirm, onCancel }) {
  return RecoveryTokenActionConfirmModalHelper.render(show, action, { onConfirm, onCancel });
}
```

`action` is `'delete'` or `'force-expire'`. The helper picks the translated title/body/confirm-
label by action (e.g. a small `TEXT_BY_ACTION` map keyed by action, mirroring
`RecoveryTokenStatusBadges`'s `STATUS_VARIANTS` map pattern), using the new
`recovery_token_action_confirm_modal.*` keys `translator` adds (see
[translator.md](../translator.md)). The cancel button always reads the shared
`recovery_token_action_confirm_modal.cancel` key regardless of `action`.

## Files to Change

- `frontend/assets/js/components/resources/staff_user/pages/elements/RecoveryTokenActionConfirmModal.jsx` —
  new component, per the shape above.
- `frontend/assets/js/components/resources/staff_user/pages/elements/helpers/RecoveryTokenActionConfirmModalHelper.jsx` —
  new helper rendering the modal shell + the action-keyed text map.
