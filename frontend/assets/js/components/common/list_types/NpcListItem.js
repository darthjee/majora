import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for an NPC entry, overriding the photo accessor to use the raw entry's
 * `profile_photo_path` (characters have no `photo_path` field) — `displayText` is inherited
 * unchanged from `BaseListItem`, since a character's `name` field already matches the base
 * default. Slain/hidden/allegiance state is read directly off `data` by the `npcs` list-type's
 * `buildActionBarProps`/`buildCardClassName`, so no extra accessors are added here.
 */
export default class NpcListItem extends BaseListItem {
  /**
   * Profile photo URL for this NPC, or null when the raw entry has none.
   *
   * @returns {string|null} Profile photo URL.
   */
  get photoUrl() {
    return this.data.profile_photo_path ?? null;
  }
}
