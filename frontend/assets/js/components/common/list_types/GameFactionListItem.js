import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a `Faction` entry (issue #812). Unlike `GamePossessionListItem`/
 * `GameItemListItem`, a `Faction` has no hidden/visibility concept at all, so no accessor is
 * overridden beyond `BaseListItem`'s own `photoUrl`/`displayText` (from `photo_path`/`name`).
 */
export default class GameFactionListItem extends BaseListItem {}
