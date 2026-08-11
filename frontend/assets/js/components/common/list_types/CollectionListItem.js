import BaseListItem from './BaseListItem.js';
import Translator from '../../../i18n/Translator.js';

/**
 * List-item wrapper for a `Collection` entry — overrides `photoUrl` since
 * `CollectionListSerializer` exposes `photo_url`, unlike `BaseListItem`'s default `photo_path`
 * field; `displayText` is inherited unchanged, since a collection's `name` field already matches
 * the base default. `formattedValue` renders the `stl_model_count` field as a caption line under
 * the photo, mirroring `TreasureListItem`'s own use of `formattedValue`.
 */
export default class CollectionListItem extends BaseListItem {
  /**
   * Photo URL for this collection, or null when it has none.
   *
   * @returns {string|null} Photo URL.
   */
  get photoUrl() {
    return this.data.photo_url ?? null;
  }

  /**
   * Formatted STL model count caption (e.g. "3 STL Models"), shown under the photo.
   *
   * @returns {string} Formatted STL model count text.
   */
  get formattedValue() {
    const count = this.data.stl_model_count ?? 0;
    return Translator.t('collections_page.stl_model_count').replace('{{count}}', count);
  }
}
