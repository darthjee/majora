import BaseListItem from './BaseListItem.js';
import { resolveCharacterSlain, resolveCharacterAllegiance } from '../../../utils/character/resolveCharacterVisibility.js';

/**
 * List-item wrapper for an NPC entry — `photoUrl`/`displayText` are inherited unchanged from
 * `BaseListItem`, since a character's `photo_path`/`name` fields already match the base
 * defaults. Hidden state is still read directly off `data` by the `npcs` list-type's
 * `buildActionBarProps`; the slain/allegiance display state (grayscale photo treatment,
 * allegiance border color) is exposed through the `slain`/`allegiance` getters below, preferring
 * the private value and falling back to the public one (see `resolveCharacterVisibility.js`).
 */
export default class NpcListItem extends BaseListItem {
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
