import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a `Game` entry — `photoUrl`/`displayText` are inherited unchanged from
 * `BaseListItem`, since a game's `photo_path`/`name` fields already match the base defaults.
 */
export default class GameListItem extends BaseListItem {
}
