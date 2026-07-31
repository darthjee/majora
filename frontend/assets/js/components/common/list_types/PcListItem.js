import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a PC entry — `photoUrl`/`displayText` are inherited unchanged from
 * `BaseListItem`, since a character's `photo_path`/`name` fields already match the base
 * defaults.
 */
export default class PcListItem extends BaseListItem {
}
