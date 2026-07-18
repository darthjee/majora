import TreasureListItem from './TreasureListItem.js';

/**
 * List-item wrapper for a character-owned treasure entry (a `CharacterTreasure` assignment),
 * extending `TreasureListItem` since the shape overlaps enough (`formattedValue`/`hidden`/
 * `availabilityText` all work unchanged once `fetchList` has merged the character's own game's
 * `game_type` onto each raw entry) — adding only the owned `quantity`, which
 * `TreasureCardHelper.buildInfoBarItems` already renders as an optional badge.
 */
export default class CharacterTreasureListItem extends TreasureListItem {
  /**
   * Quantity of this treasure the character currently owns.
   *
   * @returns {number} Owned quantity.
   */
  get quantity() {
    return this.data.quantity;
  }
}
