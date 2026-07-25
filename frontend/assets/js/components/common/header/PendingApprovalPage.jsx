import Translator from '../../../i18n/Translator.js';

/**
 * Full-page "your account is awaiting approval" screen (issue #859), rendered by {@link Header}
 * in place of the requested route's content whenever `GET /users/status.json` reports
 * `status: 'pending'` — a `pending` user still holds a valid session/token, but the permission
 * system treats them as logged out for everything else, so this replaces the normal logged-out
 * landing content with an explanation instead of a login error.
 *
 * @returns {React.ReactElement} Pending-approval page element.
 */
export default function PendingApprovalPage() {
  return (
    <div className="container mt-4 text-center">
      <h1>{Translator.t('pending_approval_page.title')}</h1>
      <p className="text-muted">{Translator.t('pending_approval_page.body')}</p>
    </div>
  );
}
