import Translator from '../../../i18n/Translator.js';

/**
 * Bootstrap badge variant for each computed recovery-token status.
 *
 * @type {object}
 */
const STATUS_VARIANTS = {
  used: 'secondary',
  revoked: 'danger',
  expired: 'warning',
  valid: 'success',
};

/**
 * Computes a `PasswordResetToken` row's display status client-side and maps it to its badge
 * variant and translated label, for the staff user detail page's recovery-token panel (see
 * `StaffUserHelper`).
 */
export default class RecoveryTokenStatusBadges {
  /**
   * Compute a token row's status from its timestamps — client-side, never the backend's
   * convenience `status` field — so it stays correct as a long-open page ages.
   * Precedence: used > revoked > expired > valid.
   *
   * @param {object} token - Row object (`used_at`, `invalidated_at`, `expires_at`).
   * @returns {string} One of `'used'`, `'revoked'`, `'expired'`, `'valid'`.
   */
  static computeStatus({ used_at: usedAt, invalidated_at: invalidatedAt, expires_at: expiresAt }) {
    if (usedAt) return 'used';
    if (invalidatedAt) return 'revoked';
    if (new Date() > new Date(expiresAt)) return 'expired';
    return 'valid';
  }

  /**
   * Build the badge descriptor (variant + translated label) for a token row.
   *
   * @param {object} token - Row object, same shape as `computeStatus`.
   * @returns {{variant: string, text: string}} Badge descriptor.
   */
  static build(token) {
    const status = RecoveryTokenStatusBadges.computeStatus(token);
    return {
      variant: STATUS_VARIANTS[status],
      text: Translator.t(`staff_user_page.recovery_token_status_${status}`),
    };
  }
}
