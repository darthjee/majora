import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a `CharacterDocument` entry (a `GameDocument` linked to a PC or NPC),
 * adding the hidden flag list rendering needs beyond the base photo/display-text accessors.
 * `name`/`photo_path` on the raw entry are already fallback-resolved server-side against the
 * linked `GameDocument`, so, mirroring `CharacterItemListItem`, no client-side fallback logic
 * is needed here either.
 */
export default class CharacterDocumentListItem extends BaseListItem {
  /**
   * Whether the document is hidden from players for this character (DM/admin-facing
   * data only, present only in the `/all.json` variant).
   *
   * @returns {boolean} Hidden flag.
   */
  get hidden() {
    return Boolean(this.data.hidden);
  }
}
