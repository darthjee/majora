import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a `GamePossession` entry, adding the hidden flag list rendering
 * needs beyond the base photo/display-text accessors. Mirrors `GameItemListItem` exactly — a
 * `GamePossession` carries no money value or availability concept either, so no other accessor
 * is overridden.
 */
export default class GamePossessionListItem extends BaseListItem {
  /**
   * Whether the possession is hidden from players for this game (DM/admin-facing data
   * only, present only in the `/all.json` variant).
   *
   * @returns {boolean} Hidden flag.
   */
  get hidden() {
    return Boolean(this.data.hidden);
  }
}
