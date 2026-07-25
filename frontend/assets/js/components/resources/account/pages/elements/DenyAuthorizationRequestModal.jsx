import DenyAuthorizationRequestModalHelper from './helpers/DenyAuthorizationRequestModalHelper.jsx';

/**
 * Confirmation modal shown before denying a pending authorization request,
 * displaying the request's IP/browser so the approving user can verify it
 * before dismissing it.
 *
 * @param {{show: boolean, request: (object|null), onConfirm: Function, onCancel: Function}} props -
 *   Component props.
 * @returns {React.ReactElement} Rendered deny confirmation modal.
 */
export default function DenyAuthorizationRequestModal({
  show, request, onConfirm, onCancel,
}) {
  return DenyAuthorizationRequestModalHelper.render(show, request, { onConfirm, onCancel });
}
