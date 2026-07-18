import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a player entry, overriding the photo/display accessors to read the
 * raw entry's nested `character` object — `character` is `null` for a DM or a player who owns
 * no PC yet, in which case `photoUrl` falls back to `null` (letting `CardAvatar` render the
 * existing character placeholder image) and `displayText` falls back to an empty caption.
 */
export default class PlayerListItem extends BaseListItem {
  /**
   * Character photo URL for this player, or null when the player has no character.
   *
   * @returns {string|null} Character photo URL.
   */
  get photoUrl() {
    return this.data.character?.photo_url ?? null;
  }

  /**
   * Character name for this player, or an empty string when the player has no character.
   *
   * @returns {string} Character name, or an empty string.
   */
  get displayText() {
    return this.data.character?.name ?? '';
  }
}
