import HashQueryParams from '../../../../../utils/routing/HashQueryParams.js';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

const BASE_PATH = '/staff/copies';
const KEYS = ['type', 'from', 'to'];

/**
 * URL state helpers for the staff copy page (issue #1571).
 *
 * @description The page keeps its `type`, `from` (source game) and `to` (target game) selection
 *   in the hash query, so reloading restores it. `from`/`to` are also generic filter keys (staff
 *   statistics date ranges), so they are read straight from the hash query here instead of going
 *   through `HashRouteResolver#getFilterParams`.
 */
export default class StaffCopyUrl {
  /**
   * Read the current selection from the hash query.
   *
   * @param {HashRouteResolver} [resolver] - Hash resolver (defaults to a fresh one).
   * @returns {{type: string, from: string, to: string}} The selection; missing keys are `''`.
   */
  static read(resolver = new HashRouteResolver()) {
    const query = HashQueryParams.parse(resolver.currentHash());

    return Object.fromEntries(KEYS.map((key) => [key, query.get(key) ?? '']));
  }

  /**
   * Build the page hash path for a selection.
   *
   * @description Empty values are omitted and pagination is never carried over, so changing
   *   any selector resets the list to its first page.
   * @param {{type?: string, from?: string, to?: string}} selection - The selection.
   * @returns {string} Hash path (without the leading `#`), e.g. `/staff/copies?type=items`.
   */
  static build(selection) {
    const params = new URLSearchParams();

    KEYS.forEach((key) => {
      if (selection[key]) params.set(key, selection[key]);
    });

    const query = params.toString();

    return query ? `${BASE_PATH}?${query}` : BASE_PATH;
  }
}
