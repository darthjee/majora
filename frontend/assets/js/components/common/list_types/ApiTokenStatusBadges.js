import Translator from '../../../i18n/Translator.js';

/**
 * Bootstrap badge variant for each API token status.
 *
 * @type {object}
 */
const STATUS_VARIANTS = {
  active: 'success',
  expired: 'secondary',
};

/**
 * Maps a scoped API token's status to its badge variant and translated label (issue #1605),
 * styled like `RecoveryTokenStatusBadges`.
 *
 * @description Unlike `RecoveryTokenStatusBadges`, the status is taken as is from the API's
 *   `status` field and never recomputed client-side; it updates on the next list fetch.
 */
export default class ApiTokenStatusBadges {
  /**
   * Build the badge descriptor (variant + translated label) for a token.
   *
   * @param {{status: string}} token - Token item (`status` is `'active'` or `'expired'`).
   * @returns {{variant: string, text: string}} Badge descriptor.
   */
  static build({ status }) {
    return {
      variant: STATUS_VARIANTS[status] ?? 'secondary',
      text: Translator.t(`api_tokens_page.status_${status}`),
    };
  }
}
