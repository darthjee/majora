import BaseListItem from './BaseListItem.js';
import TreasureMoneyHelper from '../helpers/TreasureMoneyHelper.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * List-item wrapper for a treasure entry, adding the formatted money value,
 * hidden flag, and availability line treasure list rendering needs beyond
 * the base photo/display-text accessors.
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

  /**
   * Availability line text (e.g. "Available: 3 / 10") for capped treasures
   * (`max_units` set), or `null` when the treasure is uncapped, matching the
   * guard `TreasureCardHelper` used before this list migrated onto the shared
   * `ListPage` abstraction. `TreasureCardHelper#renderAvailability` delegates
   * to this getter so the formatting logic has a single source of truth.
   *
   * @returns {string|null} Formatted availability text, or null when uncapped.
   */
  get availabilityText() {
    if (this.data.max_units === null || this.data.max_units === undefined) {
      return null;
    }

    return Translator.t('game_treasures_page.available_units_label')
      .replace('{{available}}', this.data.available_units)
      .replace('{{max}}', this.data.max_units);
  }
}
