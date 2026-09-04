# Row-status utility

A small, independently testable module computing a token row's display status and its badge descriptor (variant + translated label), following `StaffUserStatusBadges.js`'s shape exactly (a static class with a `build`-style method mapping a computed key to `{ variant, text }`).

```js
// frontend/assets/js/components/common/list_types/RecoveryTokenStatusBadges.js
import Translator from '../../../i18n/Translator.js';

const STATUS_VARIANTS = {
  used: 'secondary',
  revoked: 'danger',
  expired: 'warning',
  valid: 'success',
};

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
```

Keep field access snake_case-destructured (matching the raw API response) rather than introducing a mapping layer — no other resource in this codebase remaps API field casing on the way in.

## Files to Change

- `frontend/assets/js/components/common/list_types/RecoveryTokenStatusBadges.js` — new.
