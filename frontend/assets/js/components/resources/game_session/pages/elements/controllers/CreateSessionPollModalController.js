import GamePollNewController from '../../../../game/pages/controllers/GamePollNewController.js';

/**
 * Pure state helpers for the dynamic dates list in the create-session-poll
 * modal. The add/auto-append/remove logic itself is generic over any
 * `string[]`/`setOptions` pair, so it is delegated to
 * `GamePollNewController`'s option-list helpers rather than reimplemented.
 */
export default class CreateSessionPollModalController {
  /**
   * Handles typing into a date field, updating its value and appending a new
   * blank entry after it when the edited entry is the last one and just
   * became non-blank, so there is always exactly one blank entry at the end.
   *
   * @param {number} index - Index of the date being edited.
   * @param {string} value - New value for the date.
   * @param {string[]} dates - Current dates array.
   * @param {Function} setDates - Dates setter.
   * @returns {void}
   */
  static handleDateChange(index, value, dates, setDates) {
    GamePollNewController.handleOptionChange(index, value, dates, setDates);
  }

  /**
   * Removes a date entry from the dates array.
   *
   * @param {number} index - Index of the date to remove.
   * @param {string[]} dates - Current dates array.
   * @param {Function} setDates - Dates setter.
   * @returns {void}
   */
  static handleDateRemove(index, dates, setDates) {
    GamePollNewController.handleOptionRemove(index, dates, setDates);
  }

  /**
   * Filters out blank dates.
   *
   * @param {string[]} dates - Current dates array.
   * @returns {string[]} Only the non-blank dates.
   */
  static nonBlankDates(dates) {
    return dates.filter((date) => date.trim() !== '');
  }

  /**
   * Determines whether the modal can be confirmed, i.e. whether at least
   * one non-blank date is present.
   *
   * @param {string[]} dates - Current dates array.
   * @returns {boolean} True when at least one non-blank date is present.
   */
  static canConfirm(dates) {
    return CreateSessionPollModalController.nonBlankDates(dates).length > 0;
  }
}
