import RecoveryTokenActionConfirmModalHelper from './helpers/RecoveryTokenActionConfirmModalHelper.jsx';

/**
 * Confirmation modal shown before force-expiring or deleting a recovery token (issue #1249).
 *
 * @param {{show: boolean, action: string, onConfirm: Function, onCancel: Function}} props -
 *   Component props. `action` is `'delete'` or `'force-expire'`.
 * @returns {React.ReactElement} Rendered recovery-token action confirmation modal.
 */
export default function RecoveryTokenActionConfirmModal({
  show, action, onConfirm, onCancel,
}) {
  return RecoveryTokenActionConfirmModalHelper.render(show, action, { onConfirm, onCancel });
}
