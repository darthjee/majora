import AuthorizeAuthorizationRequestModalHelper from './helpers/AuthorizeAuthorizationRequestModalHelper.jsx';

/**
 * Confirmation modal shown before authorizing a pending authorization
 * request, displaying the request's IP/browser so the approving user can
 * verify it before granting access, and re-authenticating them with their
 * own current password.
 *
 * @param {{show: boolean, request: (object|null), password: string, error: boolean,
 *   onPasswordChange: Function, onConfirm: Function, onCancel: Function}} props - Component props.
 * @returns {React.ReactElement} Rendered authorize confirmation modal.
 */
export default function AuthorizeAuthorizationRequestModal({
  show, request, password, error, onPasswordChange, onConfirm, onCancel,
}) {
  return AuthorizeAuthorizationRequestModalHelper.render(
    show,
    request,
    { password, error },
    { onPasswordChange, onConfirm, onCancel },
  );
}
