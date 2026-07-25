import Translator from '../../../../../i18n/Translator.js';

/**
 * Displays a pending authorization request's IP address and browser,
 * reused by both the deny and authorize confirm modals so the approving
 * user can verify it's actually their own device before granting/denying
 * access. Renders nothing when no request is given (e.g. before a modal
 * has been opened for a row).
 *
 * @param {object} props - Component props.
 * @param {{ip: string, browser: string}|null} props.request - Authorization request row.
 * @returns {React.ReactElement|null} rendered IP/browser info, or null when there is no request.
 */
export default function AuthorizationRequestInfo({ request }) {
  if (!request) {
    return null;
  }

  return (
    <dl className="row mb-0">
      <dt className="col-sm-4">{Translator.t('authorization_requests_page.ip_label')}</dt>
      <dd className="col-sm-8">{request.ip}</dd>
      <dt className="col-sm-4">{Translator.t('authorization_requests_page.browser_label')}</dt>
      <dd className="col-sm-8">{request.browser}</dd>
    </dl>
  );
}
