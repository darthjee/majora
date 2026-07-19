import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a `/my-games.json` entry, reading the photo/display accessors from the
 * nested `game` object rather than a flat payload (unlike `GameListItem`) — `role`, `character`,
 * and `conversations` stay reachable via `this.data.*` for `MyGamesInfoBarRules` to build the
 * card's info-bar badges from.
 */
export default class MyGameListItem extends BaseListItem {
  /**
   * Cover photo URL for this entry's game, or null when the game has none.
   *
   * @returns {string|null} Cover photo URL.
   */
  get photoUrl() {
    return this.data.game.cover_photo_path ?? null;
  }

  /**
   * Display text for this entry's game name.
   *
   * @returns {string} Game name.
   */
  get displayText() {
    return this.data.game.name;
  }
}
