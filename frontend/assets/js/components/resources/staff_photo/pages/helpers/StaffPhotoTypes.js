import Translator from '../../../../../i18n/Translator.js';

/**
 * Photo-type helpers for the staff photos page: active-type resolution and tab labels.
 */
export default class StaffPhotoTypes {
  /**
   * Resolves the active photo type.
   *
   * @description Returns `requested` when it is one of the available `types`, otherwise falls
   *   back to the first available type (or `null` when there are none).
   * @param {string[]} types - Available photo type slugs.
   * @param {string|null|undefined} requested - Requested photo type slug (e.g. from the hash).
   * @returns {string|null} The resolved photo type slug.
   */
  static resolveType(types, requested) {
    if (types.includes(requested)) return requested;

    return types[0] ?? null;
  }

  /**
   * Builds the tab label for a photo type.
   *
   * @description Translates `staff_photos_page.types.<slug>`, falling back to the raw slug when
   *   the key is missing.
   * @param {string} slug - Photo type slug.
   * @returns {string} The tab label.
   */
  static label(slug) {
    return Translator.t(`staff_photos_page.types.${slug}`, slug);
  }
}
