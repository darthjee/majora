import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for an `StlModel` entry — overrides `photoUrl` since
 * `StlModelListSerializer` exposes `photo_url`, unlike `BaseListItem`'s default `photo_path`
 * field; `displayText` is inherited unchanged, since a STL model's `name` field already matches
 * the base default.
 */
export default class StlModelListItem extends BaseListItem {
  /**
   * Photo URL for this STL model, or null when it has none.
   *
   * @returns {string|null} Photo URL.
   */
  get photoUrl() {
    return this.data.photo_url ?? null;
  }
}
