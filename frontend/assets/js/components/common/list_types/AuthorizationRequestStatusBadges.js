import Translator from '../../../i18n/Translator.js';

/**
 * Bootstrap badge variant for each `AuthorizationRequest` status. `logged`
 * uses a custom `authorization-logged` variant (a darker shade of blue than
 * `approved`'s stock `primary`), since Bootstrap's built-in palette has no
 * distinct "darker blue" — see `main.scss`'s `.bg-authorization-logged` rule.
 *
 * @type {object}
 */
const STATUS_VARIANTS = {
  open: 'success',
  approved: 'primary',
  logged: 'authorization-logged',
  denied: 'danger',
  expired: 'secondary',
};

/**
 * Maps an `AuthorizationRequest` status to its badge variant and translated
 * label, for the authorization requests list page (see
 * `AuthorizationRequestsHelper`).
 */
export default class AuthorizationRequestStatusBadges {
  /**
   * Builds the badge descriptor (variant + translated label) for the given status.
   *
   * @param {string} status - Authorization request status (`'open'`, `'approved'`,
   *   `'denied'`, `'expired'`, or `'logged'`).
   * @returns {{variant: string, text: string}} Badge descriptor for the given status.
   */
  static build(status) {
    return {
      variant: STATUS_VARIANTS[status] ?? 'secondary',
      text: Translator.t(`authorization_requests_page.status_${status}`),
    };
  }
}
