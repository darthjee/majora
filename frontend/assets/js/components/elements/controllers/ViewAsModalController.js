import AccessStore from '../../../utils/AccessStore.js';

/**
 * Manages local edit-state transitions and the save/cancel actions for the
 * ViewAsModal "view as" facade editor. Local edits are only committed to
 * {@link AccessStore} on save; cancelling discards them.
 */
export default class ViewAsModalController {
  /**
   * Creates a new ViewAsModalController instance.
   *
   * @param {Function} setEnabled - State setter for the in-progress "enabled" flag.
   * @param {Function} setRoles - State setter for the in-progress roles array.
   * @param {Function} onClose - Callback invoked to close the modal.
   */
  constructor(setEnabled, setRoles, onClose) {
    this.setEnabled = setEnabled;
    this.setRoles = setRoles;
    this.onClose = onClose;
  }

  /**
   * Toggles the in-progress "facade enabled" flag.
   *
   * @returns {void}
   */
  handleToggleEnabled() {
    this.setEnabled((current) => !current);
  }

  /**
   * Toggles a single role in the in-progress roles array.
   *
   * @param {string} role - Role to toggle (`'dm'`, `'player'`, or `'owner'`).
   * @returns {void}
   */
  handleToggleRole(role) {
    this.setRoles((current) => (
      current.includes(role)
        ? current.filter((existingRole) => existingRole !== role)
        : [...current, role]
    ));
  }

  /**
   * Discards the in-progress edit and closes the modal, without touching `AccessStore`.
   *
   * @returns {void}
   */
  handleCancel() {
    this.onClose();
  }

  /**
   * Commits the in-progress edit to `AccessStore`'s "view as" facade, then closes the modal.
   *
   * @param {boolean} enabled - Whether the facade should be active.
   * @param {string[]} roles - Roles to simulate while the facade is active.
   * @returns {void}
   */
  handleSave(enabled, roles) {
    AccessStore.setFacade({ enabled, roles });
    this.onClose();
  }
}
