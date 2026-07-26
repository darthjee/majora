import BaseListItem from './BaseListItem.js';
import { resolveCharacterSlain, resolveCharacterAllegiance } from '../../../utils/character/resolveCharacterVisibility.js';

/**
 * List-item wrapper for an NPC entry, overriding the photo accessor to use the raw entry's
 * `profile_photo_path` (characters have no `photo_path` field) — `displayText` is inherited
 * unchanged from `BaseListItem`, since a character's `name` field already matches the base
 * default. Hidden state is still read directly off `data` by the `npcs` list-type's
 * `buildActionBarProps`; the slain/allegiance display state (grayscale photo treatment,
 * allegiance border color) is exposed through the `slain`/`allegiance` getters below, preferring
 * the private value and falling back to the public one (see `resolveCharacterVisibility.js`).
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

  /**
   * This NPC's slain state, preferring `private_slain` and falling back to `public_slain`.
   *
   * @returns {boolean|undefined} The resolved slain state.
   */
  get slain() {
    return resolveCharacterSlain(this.data);
  }

  /**
   * This NPC's allegiance, preferring `private_allegiance` and falling back to
   * `public_allegiance`.
   *
   * @returns {string|undefined} The resolved allegiance.
   */
  get allegiance() {
    return resolveCharacterAllegiance(this.data);
  }
}
