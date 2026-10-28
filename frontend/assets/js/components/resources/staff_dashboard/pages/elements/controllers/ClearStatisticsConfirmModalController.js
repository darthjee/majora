/**
 * The word the user must type to confirm the clear. Never translated.
 */
export const CONFIRMATION_WORD = 'CLEAR';

/**
 * Handles the typed confirmation of the `ClearStatisticsConfirmModal` element (issue #1685).
 *
 * @description Confirm is only allowed once the input matches `CLEAR` exactly (case-sensitive,
 *   trimmed). Cancel, close and confirm all reset the input, so reopening starts empty.
 */
export default class ClearStatisticsConfirmModalController {
  /**
   * Create a clear-statistics confirmation modal controller.
   *
   * @param {Function} setValue - Typed value setter.
   * @param {{onConfirm: Function, onCancel: Function}} callbacks - The modal's own callbacks.
   */
  constructor(setValue, { onConfirm, onCancel }) {
    this.setValue = setValue;
    this.onConfirm = onConfirm;
    this.onCancel = onCancel;
  }

  /**
   * Whether a typed value confirms the clear.
   *
   * @param {string} value - The typed value.
   * @returns {boolean} `true` when the trimmed value is exactly `CLEAR`.
   */
  static canConfirm(value) {
    return value.trim() === CONFIRMATION_WORD;
  }

  /**
   * Store the typed value from an input change event.
   *
   * @param {{target: {value: string}}} event - The input change event.
   * @returns {void}
   */
  change(event) {
    this.setValue(event.target.value);
  }

  /**
   * Reset the input, then cancel.
   *
   * @returns {void}
   */
  cancel() {
    this.setValue('');
    this.onCancel();
  }

  /**
   * Reset the input, then confirm.
   *
   * @returns {void}
   */
  confirm() {
    this.setValue('');
    this.onConfirm();
  }
}
