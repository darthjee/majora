import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a `GameDocument` entry, adding the hidden flag list rendering
 * needs beyond the base photo/display-text accessors, mirroring `GameItemListItem`.
 */
export default class GameDocumentListItem extends BaseListItem {
  /**
   * Whether the document is hidden from players for this game (DM/admin-facing data
   * only, present only in the `/all.json` variant).
   *
   * @returns {boolean} Hidden flag.
   */
  get hidden() {
    return Boolean(this.data.hidden);
  }
}
