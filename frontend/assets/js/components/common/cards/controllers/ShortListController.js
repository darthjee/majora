import RequestStore from '../../../../utils/requests/RequestStore.js';
import shortListResourceConfig from '../shortListResourceConfig.js';

/**
 * Manages a single `ShortList` element's preview-list fetch, driven by the resource's
 * `shortListResourceConfig` entry (`buildParams`).
 */
export default class ShortListController {
  /**
   * Creates a new ShortListController instance.
   *
   * @param {string} resource - Resource type key into `shortListResourceConfig`
   *   (`'pc'`, `'npc'`, `'treasure'`, `'item'`, `'document'`).
   * @param {Function} setItems - State setter for the fetched preview items.
   * @param {Function} setLoading - State setter for the loading flag.
   */
  constructor(resource, setItems, setLoading) {
    this.resource = resource;
    this.setItems = setItems;
    this.setLoading = setLoading;
  }

  /**
   * Build the element's mount effect, fetching the resource's preview list through
   * {@link RequestStore.ensure} (`<resource>.collection`), degrading to an empty list on
   * failure so a broken shortlist never blocks rendering of the rest of the show page. Guards
   * against updating state after unmount, mirroring `OpenPollsWidgetController#buildEffect`.
   *
   * @param {object} context - Merged `ShowPageLayout` rendering context, forwarded to the
   *   resource's configured `buildParams`.
   * @param {number} maxItems - Maximum number of items to request (`per_page`).
   * @returns {Function} Effect callback.
   */
  buildEffect(context, maxItems) {
    return () => {
      let mounted = true;

      RequestStore.ensure({
        componentName: 'ShortListController',
        resource: this.resource,
        quantityType: 'collection',
        params: shortListResourceConfig[this.resource].buildParams(context),
        query: { per_page: maxItems },
      })
        .then(({ data }) => this.#handleResponse(data, mounted))
        .catch(() => this.#handleResponse([], mounted))
        .finally(() => {
          if (mounted) {
            this.setLoading(false);
          }
        });

      return () => {
        mounted = false;
      };
    };
  }

  #handleResponse(data, mounted) {
    if (!mounted) {
      return;
    }

    this.setItems(Array.isArray(data) ? data : []);
  }
}
