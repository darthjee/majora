import Translator from '../../../i18n/Translator.js';

/**
 * Bootstrap badge variant for each `UserProfile` status. Unlike
 * `AuthorizationRequestStatusBadges`'s `logged` status, every status here maps to a stock
 * Bootstrap variant (no custom SCSS class needed).
 *
 * @type {object}
 */
const STATUS_VARIANTS = {
  pending: 'warning',
  approved: 'success',
  denied: 'danger',
};

/**
 * Maps a `UserProfile` status to its badge variant and translated label, for the staff users
 * list page (see `StaffUsersHelper`).
 */
export default class StaffUserStatusBadges {
  /**
   * Builds the badge descriptor (variant + translated label) for the given status.
   *
   * @param {string} status - User status (`'pending'`, `'approved'`, or `'denied'`).
   * @returns {{variant: string, text: string}} Badge descriptor for the given status.
   */
  static build(status) {
    return {
      variant: STATUS_VARIANTS[status] ?? 'secondary',
      text: Translator.t(`staff_users_page.status_${status}`),
    };
  }
}
