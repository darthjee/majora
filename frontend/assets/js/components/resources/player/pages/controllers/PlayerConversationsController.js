import GenericClient from '../../../../../client/GenericClient.js';
import PlayerClient from '../../../../../client/PlayerClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import HashQueryParams from '../../../../../utils/routing/HashQueryParams.js';
import parsePositiveInt from '../../../../../utils/parsePositiveInt.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import PlayerController from './PlayerController.js';

/**
 * Query param name used for the conversations column's own pagination, distinct from `page` so
 * it doesn't collide with any page-level pagination on the player detail route.
 *
 * @type {string}
 */
export const CONV_PAGE_PARAM = 'conv_page';

/**
 * Controller for the paginated conversations column of the player detail page (issue #695).
 *
 * @description Fetches independently of the player fetch itself ({@link PlayerController}),
 *   since the conversations list is paginated on its own `conv_page` query param.
 */
export default class PlayerConversationsController extends BasePageController {
  /**
   * Create a player conversations controller.
   *
   * @param {Function} setConversations - Conversations setter.
   * @param {Function} setPagination - Pagination setter.
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - Error setter.
   * @param {GenericClient|null} [client] - Client override, used for hash resolution.
   * @param {PlayerClient|null} [playerClient] - Player client override.
   */
  constructor(
    setConversations,
    setPagination,
    setLoading,
    setError,
    client = null,
    playerClient = null,
  ) {
    super();
    this.setConversations = setConversations;
    this.setPagination = setPagination;
    this.setLoading = setLoading;
    this.setError = setError;
    this.client = client ?? new GenericClient();
    this.playerClient = playerClient ?? new PlayerClient();
  }

  /**
   * Build page loading effect.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const safeSet = this.buildSafeSetter(() => mounted);
      const hash = this.client.currentHash();
      const { game_slug: gameSlug, id } = PlayerController.getPlayerParamsFromHash(hash);
      const page = HashQueryParams.parse(hash).get(CONV_PAGE_PARAM);

      if (!gameSlug || !id) {
        safeSet(this.setError, 'Unable to load conversations.');
        safeSet(this.setLoading, false);
      } else {
        this.#fetchConversations(gameSlug, id, page, safeSet);
      }

      return () => {
        mounted = false;
      };
    };
  }

  #fetchConversations(gameSlug, playerId, page, safeSet) {
    const token = AuthStorage.getToken();
    const params = new URLSearchParams();

    if (page) {
      params.set('page', page);
    }

    return this.playerClient.fetchConversations(gameSlug, playerId, token, params)
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load conversations.');
        return response.json().then((data) => ({ data, headers: response.headers }));
      })
      .then(({ data, headers }) => {
        safeSet(this.setConversations, Array.isArray(data) ? data : []);
        safeSet(this.setPagination, {
          page: parsePositiveInt(headers.get('page'), 1),
          pages: parsePositiveInt(headers.get('pages'), 1),
          perPage: parsePositiveInt(headers.get('per_page'), 10),
        });
      })
      .catch(() => safeSet(this.setError, 'Unable to load conversations.'))
      .finally(() => safeSet(this.setLoading, false));
  }
}
