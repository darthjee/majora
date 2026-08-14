import AccessStore from '../../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../../utils/requests/RequestStore.js';
import HashQueryParams from '../../../../../../utils/routing/HashQueryParams.js';
import getCurrentHash from '../../../../../../utils/routing/currentHash.js';

const GENERIC_ERROR_KEY = 'faction_exchange_modal.generic_error';

/**
 * Manages the faction show page's character-list panel (issue #943): fetches one page of the
 * faction's characters through `RequestStore` (`faction.characters`), reading `page`/`per_page`
 * directly from the current hash's query string (the URL is the source of truth — no component
 * pagination state), mirroring the plan's own "real pagination synced to the URL hash" requirement
 * rather than `ShortList`'s capped-preview approach.
 *
 * @description Also (issue #1106) resolves the viewer's DM/admin-equivalent status
 *   (`AccessStore.ensureGamePermissions`'s `can_edit`) alongside every fetch — the exact same
 *   source of truth `RequestPermissionResolvers`'s own `faction.characters` resolver consults to
 *   pick between `characters.json`/`characters/all.json` — so the panel always knows which of the
 *   two endpoints actually served its current page, and can route a per-row kick request through
 *   the matching `regular`/`private` `remove` variant. Also steps back to the last valid page (and
 *   refetches) whenever a fetch resolves a `page` past `pages` (e.g. after kicking the last
 *   character off the last page), navigating there via the URL hash rather than any local
 *   pagination state, mirroring how every other pagination-driving fetch on this panel already
 *   reads `page` from the hash.
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
   * Resolve whether the current viewer is DM/admin-equivalent for this game (`can_edit`, via
   * `AccessStore.ensureGamePermissions`) — see this class's own description. Never rejects; fails
   * closed to `false`.
   *
   * @param {string} gameSlug - Game slug.
   * @returns {Promise<boolean>} Resolves to whether the viewer is DM/admin-equivalent.
   */
  isDmOrAdmin(gameSlug) {
    return AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_edit))
      .catch(() => false);
  }

  /**
   * Build the panel's mount effect, fetching the current page's characters (plus the viewer's
   * DM/admin status) and updating `setState` through the loading/success/error cycle. Guards
   * against updating state after unmount, mirroring `ShortListController#buildEffect`.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} factionId - `GameFaction` id.
   * @param {Function} setState - React state setter for
   *   `{items, pagination, isDmOrAdmin, loading, error}`.
   * @returns {Function} Effect callback.
   */
  buildEffect(gameSlug, factionId, setState) {
    return () => {
      let mounted = true;

      setState((prev) => ({ ...prev, loading: true, error: '' }));
      this.#load(gameSlug, factionId, () => mounted, setState);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Submit a kick (remove) request for the given faction character, through `RequestStore.mutate`
   * (`faction.remove`), mirroring `RemoveFactionTabController#remove`'s shape exactly — the
   * character's own per-character remove endpoints are reused as-is.
   *
   * @param {string} gameSlug - Game slug.
   * @param {object} character - Faction character-list entry (`id`, `type`).
   * @param {string|number} factionId - `GameFaction` id the character is being kicked from.
   * @param {boolean} isDmOrAdmin - Whether the requester is DM/admin-equivalent; routes the
   *   request through the `private` (`remove/all.json`) variant instead of `regular`.
   * @returns {Promise<{ok: boolean, errorKey: (string|undefined)}>} Resolves to `{ok: true}` on
   *   success, or `{ok: false, errorKey}` on failure (including an already-removed 404).
   */
  kick(gameSlug, character, factionId, isDmOrAdmin) {
    const kind = character.type === 'npc' ? 'npcs' : 'pcs';

    return RequestStore.mutate({
      componentName: 'FactionCharactersPanelController',
      resource: 'faction',
      method: 'POST',
      quantityType: 'remove',
      params: { gameSlug, kind, id: character.id },
      body: { game_faction_id: factionId },
      variantName: isDmOrAdmin ? 'private' : 'regular',
    }).then((response) => FactionCharactersPanelController.#parseActionResponse(response));
  }

  /**
   * Submits the kick request for the given faction character, then applies the outcome: purging
   * the faction cache and invoking `onSuccess` on success, or surfacing the error key otherwise.
   *
   * @param {object} character - Faction character-list entry pending kick-confirmation.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} factionId - `GameFaction` id the character is being kicked from.
   * @param {boolean} isDmOrAdmin - Whether the requester is DM/admin-equivalent.
   * @param {{setSubmitting: Function, setError: Function, onSuccess: Function}} setters - State
   *   setters and callbacks; `onSuccess()` is invoked once the kick has succeeded and the faction
   *   cache has been purged.
   * @returns {Promise<void>} Resolves once the outcome has been fully applied.
   */
  confirmKick(character, gameSlug, factionId, isDmOrAdmin, setters) {
    setters.setSubmitting(true);

    return this.kick(gameSlug, character, factionId, isDmOrAdmin).then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setError(result.errorKey);
        return;
      }

      RequestStore.purge({ resource: 'faction' });
      setters.setError('');
      setters.onSuccess();
    });
  }

  #load(gameSlug, factionId, isMounted, setState) {
    return Promise.all([this.isDmOrAdmin(gameSlug), this.fetchPage(gameSlug, factionId)])
      .then(([isDmOrAdmin, { data, pagination }]) => {
        if (!isMounted()) return undefined;

        if (FactionCharactersPanelController.#isOutOfRange(pagination)) {
          FactionCharactersPanelController.#redirectToLastPage(pagination.pages);
          return this.#load(gameSlug, factionId, isMounted, setState);
        }

        setState({
          items: data, pagination, isDmOrAdmin, loading: false, error: '',
        });
        return undefined;
      })
      .catch(() => {
        if (!isMounted()) return;
        setState((prev) => ({ ...prev, loading: false, error: 'faction_page.characters_panel_error' }));
      });
  }

  static #isOutOfRange(pagination) {
    return pagination.page > pagination.pages;
  }

  static #redirectToLastPage(pages) {
    const hash = getCurrentHash();
    const [path] = hash.split('?');
    const query = HashQueryParams.parse(hash);

    query.set('page', String(pages));
    window.location.hash = `${path}?${query.toString()}`;
  }

  static async #parseActionResponse(response) {
    if (response.status === 204) {
      return { ok: true };
    }

    return { ok: false, errorKey: GENERIC_ERROR_KEY };
  }
}
