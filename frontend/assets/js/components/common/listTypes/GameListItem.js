import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a `Game` entry, overriding the photo accessor to use the raw entry's
 * `cover_photo_path` (games have no `photo_path` field) — `displayText` is inherited unchanged
 * from `BaseListItem`, since a game's `name` field already matches the base default.
 */
export default class GameListItem extends BaseListItem {
  /**
   * Cover photo URL for this game, or null when the raw entry has none.
   *
   * @returns {string|null} Cover photo URL.
   */
  get photoUrl() {
    return this.data.cover_photo_path ?? null;
  }
}
