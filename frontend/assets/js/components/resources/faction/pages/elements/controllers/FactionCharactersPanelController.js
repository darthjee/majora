import RequestStore from '../../../../../../utils/requests/RequestStore.js';
import HashQueryParams from '../../../../../../utils/routing/HashQueryParams.js';
import getCurrentHash from '../../../../../../utils/routing/currentHash.js';

/**
 * Manages the faction show page's character-list panel (issue #943): fetches one page of the
 * faction's characters through `RequestStore` (`faction.characters`), reading `page`/`per_page`
 * directly from the current hash's query string (the URL is the source of truth — no component
 * pagination state), mirroring the plan's own "real pagination synced to the URL hash" requirement
 * rather than `ShortList`'s capped-preview approach.
 */
export default class FactionCharactersPanelController {
  /**
   * Fetch one page of a faction's characters through `RequestStore` (`faction.characters`).
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} factionId - `GameFaction` id.
   * @returns {Promise<{data: object[], pagination: object}>} Page of faction characters with
   *   pagination metadata.
   */
  fetchPage(gameSlug, factionId) {
    const query = HashQueryParams.parse(getCurrentHash());
    const page = query.get('page');
    const perPage = query.get('per_page');

    return RequestStore.ensure({
      componentName: 'FactionCharactersPanelController',
      resource: 'faction',
      quantityType: 'characters',
      params: { gameSlug, id: factionId },
      query: { page: page ?? undefined, per_page: perPage ?? undefined },
    }).then(({ data, pagination }) => ({ data: Array.isArray(data) ? data : [], pagination }));
  }

  /**
   * Build the panel's mount effect, fetching the current page's characters and updating
   * `setState` through the loading/success/error cycle. Guards against updating state after
   * unmount, mirroring `ShortListController#buildEffect`.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} factionId - `GameFaction` id.
   * @param {Function} setState - React state setter for
   *   `{items, pagination, loading, error}`.
   * @returns {Function} Effect callback.
   */
  buildEffect(gameSlug, factionId, setState) {
    return () => {
      let mounted = true;

      setState((prev) => ({ ...prev, loading: true, error: '' }));

      this.fetchPage(gameSlug, factionId)
        .then(({ data, pagination }) => {
          if (!mounted) return;
          setState({
            items: data, pagination, loading: false, error: '',
          });
        })
        .catch(() => {
          if (!mounted) return;
          setState((prev) => ({ ...prev, loading: false, error: 'faction_page.characters_panel_error' }));
        });

      return () => {
        mounted = false;
      };
    };
  }
}
