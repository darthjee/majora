import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a `GameItem` entry, adding the hidden flag list rendering
 * needs beyond the base photo/display-text accessors. Unlike `TreasureListItem`, a
 * `GameItem` carries no money value or availability concept, so no other accessor
 * is overridden.
 */
export default class GameItemListItem extends BaseListItem {
  /**
   * Whether the item is hidden from players for this game (DM/admin-facing data
   * only, present only in the `/all.json` variant).
   *
   * @returns {boolean} Hidden flag.
   */
  get hidden() {
    return Boolean(this.data.hidden);
  }
}
