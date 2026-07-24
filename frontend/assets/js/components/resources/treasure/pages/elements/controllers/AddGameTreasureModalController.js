import TreasureClient from '../../../../../../client/TreasureClient.js';
import RequestStore from '../../../../../../utils/requests/RequestStore.js';
import parsePositiveInt from '../../../../../../utils/parsePositiveInt.js';

const GENERIC_ERROR_KEY = 'add_game_treasure_modal.save_error';

/**
 * Manages browsing the catalog treasures missing from a game and submitting
 * the request that links a selected one, for the Add Treasure modal.
 */
export default class AddGameTreasureModalController {
  /**
   * Create an Add Treasure modal controller.
   *
   * @param {TreasureClient|null} [treasureClient] - Treasure client override.
   */
  constructor(treasureClient = null) {
    this.treasureClient = treasureClient ?? new TreasureClient();
  }

  /**
   * Fetch a page of catalog treasures not yet linked to the game.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {{page: number, perPage: number}} params - Pagination params.
   * @returns {Promise<{data: object[], pagination: object}>} Page of treasures with
   *   pagination metadata.
   */
  fetchMissingPage(gameSlug, token, params) {
    return this.treasureClient.fetchMissingGameTreasuresPage(gameSlug, token, params)
      .then((response) => this.#parseIndexResponse(response));
  }

  /**
   * Submit a request linking the selected treasure to the game, through {@link RequestStore.mutate}
   * (issue #842, so the game's treasure cache is purged on success).
   *
   * @param {string} gameSlug - Game slug.
   * @param {{treasure_id: number, value: number, hidden: boolean, max_units: number|null}}
   *   fields - Link request fields.
   * @returns {Promise<object>} Resolves to `{ok: true, treasure}` on success (`treasure` being
   *   the created `GameTreasure` detail), or `{ok: false, errorKey}` on a non-2xx response.
   */
  link(gameSlug, fields) {
    return RequestStore.mutate({
      componentName: 'AddGameTreasureModalController',
      resource: 'treasure',
      method: 'POST',
      quantityType: 'link',
      params: { gameSlug },
      body: fields,
    }).then((response) => this.#parseLinkResponse(response));
  }

  async #parseIndexResponse(response) {
    if (!response.ok) {
      throw new Error('Unable to load treasures.');
    }

    const data = await response.json();

    return {
      data: Array.isArray(data) ? data : [],
      pagination: {
        page: parsePositiveInt(response.headers.get('page'), 1),
        pages: parsePositiveInt(response.headers.get('pages'), 1),
        perPage: parsePositiveInt(response.headers.get('per_page'), 10),
      },
    };
  }

  async #parseLinkResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (response.status === 201) {
      return { ok: true, treasure: data };
    }

    return { ok: false, errorKey: GENERIC_ERROR_KEY };
  }
}
