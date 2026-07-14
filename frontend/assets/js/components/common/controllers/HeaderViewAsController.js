import AccessStore from '../../../utils/access/store/AccessStore.js';

/**
 * Manages the header's "view as" button visibility (gated on the real,
 * facade-independent admin/staff check) and the facade modal's open state.
 * Kept separate from {@link HeaderController} so this small, focused
 * concern doesn't compete for line/complexity budget with the header's own
 * auth/route/health-check orchestration.
 */
export default class HeaderViewAsController {
  /**
   * Creates a new HeaderViewAsController instance.
   *
   * @param {Function} setCanViewAs - state setter for the "view as" button visibility.
   * @param {Function} setShowViewAsModal - state setter for the "view as" modal visibility.
   * @param {typeof AccessStore} [accessStore] - store used for the real admin/staff check.
   */
  constructor(setCanViewAs, setShowViewAsModal, accessStore = AccessStore) {
    this.setCanViewAs = setCanViewAs;
    this.setShowViewAsModal = setShowViewAsModal;
    this.accessStore = accessStore;
  }

  /**
   * Refreshes the header's "view as" button visibility from the real,
   * facade-independent admin/staff check (unaffected by any active "view as"
   * facade).
   *
   * @returns {Promise<void>} resolves when the check settles.
   */
  async checkAvailability() {
    const result = await this.accessStore.isReallyAdminOrStaff();

    this.setCanViewAs(Boolean(result));
  }

  /**
   * Opens the "view as" facade modal.
   *
   * @returns {void}
   */
  handleViewAsClick() {
    this.setShowViewAsModal(true);
  }

  /**
   * Closes the "view as" facade modal.
   *
   * @returns {void}
   */
  handleViewAsModalClose() {
    this.setShowViewAsModal(false);
  }
}
