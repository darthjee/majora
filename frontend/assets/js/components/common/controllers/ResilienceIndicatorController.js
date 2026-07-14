import ResilienceEvents from '../../../utils/logging/ResilienceEvents.js';

/**
 * Manages the current resilience status for the ResilienceIndicator element.
 */
export default class ResilienceIndicatorController {
  /**
   * Creates a new ResilienceIndicatorController instance.
   *
   * @param {Function} setStatus - state setter for the current resilience status.
   */
  constructor(setStatus) {
    this.setStatus = setStatus;
  }

  /**
   * Reads the current global resilience status.
   *
   * @returns {'idle'|'requesting'|'retrying'} the current resilience status.
   */
  getStatus() {
    return ResilienceEvents.getStatus();
  }

  /**
   * Handles a resilience status change notification, syncing local state
   * with the current global status.
   *
   * @returns {void}
   */
  handleChange() {
    this.setStatus(ResilienceEvents.getStatus());
  }
}
