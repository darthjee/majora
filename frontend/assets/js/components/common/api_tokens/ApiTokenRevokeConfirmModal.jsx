import ApiTokenRevokeConfirmModalHelper from './helpers/ApiTokenRevokeConfirmModalHelper.jsx';

/**
 * Confirmation modal shown before revoking a scoped API token (issue #1605), shared by the
 * owner token page and the staff token panel (#1606).
 *
 * @param {object} props - Component props.
 * @param {boolean} props.show - Whether the modal is visible.
 * @param {string} [props.tokenName] - Name of the token being revoked.
 * @param {string} [props.ownerName] - Token owner's name; when given, the staff copy is used.
 * @param {Function} props.onConfirm - Handler invoked when the revoke is confirmed.
 * @param {Function} props.onCancel - Handler invoked when the modal is dismissed.
 * @param {boolean} [props.submitting] - Whether the revoke request is in flight.
 * @returns {React.ReactElement} Rendered revoke confirmation modal.
 */
export default function ApiTokenRevokeConfirmModal({
  show, tokenName, ownerName, onConfirm, onCancel, submitting = false,
}) {
  return ApiTokenRevokeConfirmModalHelper.render(
    { show, tokenName, ownerName, submitting },
    { onConfirm, onCancel },
  );
}
