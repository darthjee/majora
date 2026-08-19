/**
 * Manages the header's "view as" button visibility (gated on the real,
 * facade-independent admin/staff check) and the facade modal's open state.
 * Kept separate from {@link HeaderController} so this small, focused
 * concern doesn't compete for line/complexity budget with the header's own
 * auth/route orchestration.
 */
export default class HeaderViewAsController {
  /**
   * Creates a new HeaderViewAsController instance.
   *
   * @param {Function} setCanViewAs - state setter for the "view as" button visibility.
   * @param {Function} setShowViewAsModal - state setter for the "view as" modal visibility.
   */
  constructor(setCanViewAs, setShowViewAsModal) {
    this.setCanViewAs = setCanViewAs;
    this.setShowViewAsModal = setShowViewAsModal;
  }

  /**
   * Refreshes the header's "view as" button visibility from the real,
   * facade-independent admin/staff flags already resolved by
   * `HeaderController#checkStatus` (unaffected by any active "view as" facade).
   *
   * @param {boolean} isSuperUser - Whether the real (non-facade) identity is a superuser.
   * @param {boolean} isStaff - Whether the real (non-facade) identity is staff.
   * @returns {Promise<void>} resolves once the derived availability is applied.
   */
  async checkAvailability(isSuperUser, isStaff) {
    this.setCanViewAs(Boolean(isSuperUser || isStaff));
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
