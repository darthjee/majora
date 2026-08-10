import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a `Source` entry — overrides `photoUrl` since `SourceListSerializer`
 * exposes `photo_url`, unlike `BaseListItem`'s default `photo_path` field; `displayText` is
 * inherited unchanged, since a source's `name` field already matches the base default.
 */
export default class SourceListItem extends BaseListItem {
  /**
   * Photo URL for this source, or null when it has none.
   *
   * @returns {string|null} Photo URL.
   */
  get photoUrl() {
    return this.data.photo_url ?? null;
  }
}
