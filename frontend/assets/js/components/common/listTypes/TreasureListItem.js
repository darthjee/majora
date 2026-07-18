import BaseListItem from './BaseListItem.js';
import TreasureMoneyHelper from '../helpers/TreasureMoneyHelper.jsx';

/**
 * List-item wrapper for a treasure entry, adding the formatted money value
 * and hidden flag treasure list rendering needs beyond the base
 * photo/display-text accessors.
 */
export default class TreasureListItem extends BaseListItem {
  /**
   * Treasure value formatted as a denomination breakdown, delegating to
   * `TreasureMoneyHelper` (the same transformation `TreasureMoney` renders)
   * so this wrapper doesn't duplicate currency-formatting logic.
   *
   * @returns {string} Formatted treasure value.
   */
  get formattedValue() {
    return TreasureMoneyHelper.render(this.data.value, this.data.game_type);
  }

  /**
   * Whether the treasure is hidden from players for this game (DM/admin-facing
   * data only).
   *
   * @returns {boolean} Hidden flag.
   */
  get hidden() {
    return Boolean(this.data.hidden);
  }
}
