import BaseListItem from './BaseListItem.js';
import TreasureMoneyHelper from '../misc/helpers/TreasureMoneyHelper.jsx';
import Translator from '../../../i18n/Translator.js';

/**
 * List-item wrapper for a `GameCommonItem` entry (issue #826), adding the formatted price and
 * translated category caption lines, plus the hidden flag, list rendering needs beyond the base
 * photo/display-text accessors. Unlike `GamePossessionListItem` (which has neither), this catalog
 * surfaces `price`/`category` at the list level since browsing prices is the whole point of this
 * catalog.
 */
export default class GameCommonItemListItem extends BaseListItem {
  /**
   * Common item price formatted as a denomination breakdown, delegating to
   * `TreasureMoneyHelper` (the same transformation `TreasureMoney` renders) so this wrapper
   * doesn't duplicate currency-formatting logic. `GameCommonItem` carries no `game_type` field of
   * its own, so this always renders through the default (`dnd`) currency model.
   *
   * @returns {string} Formatted common item price.
   */
  get formattedValue() {
    return TreasureMoneyHelper.render(this.data.price);
  }

  /**
   * Common item category, translated via `common_item_page.category.<value>`, shown as a caption
   * line under the price.
   *
   * @returns {string} Translated category label.
   */
  get availabilityText() {
    return Translator.t(`common_item_page.category.${this.data.category ?? 'other'}`);
  }

  /**
   * Whether the common item is hidden from players for this game (DM/admin-facing data
   * only, present only in the `/all.json` variant).
   *
   * @returns {boolean} Hidden flag.
   */
  get hidden() {
    return Boolean(this.data.hidden);
  }
}
