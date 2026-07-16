import CharacterClient from '../../../../../../client/CharacterClient.js';
import TreasureClient from '../../../../../../client/TreasureClient.js';

const ERROR_KEY_BY_MESSAGE = {
  'insufficient funds': 'treasure_exchange_modal.insufficient_funds',
  'not enough owned': 'treasure_exchange_modal.not_enough_owned',
};

const GENERIC_ERROR_KEY = 'treasure_exchange_modal.generic_error';

/**
 * Parses a pagination header value into a positive integer, falling back
 * when the value is missing or invalid.
 *
 * @param {string|null} value - Raw header value.
 * @param {number} fallback - Fallback value.
 * @returns {number} Parsed positive integer.
 */
function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

/**
 * Manages browsing (Acquire/Sell tab) and acquire/sell action requests for
 * the treasure exchange modal, keeping pagination and submission state
 * driven by local component state rather than the URL.
 */
export default class TreasureExchangeModalController {
  /**
   * Create a treasure exchange modal controller.
   *
   * @param {CharacterClient|null} [characterClient] - Character client override.
   * @param {TreasureClient|null} [treasureClient] - Treasure client override.
   */
  constructor(characterClient = null, treasureClient = null) {
    this.characterClient = characterClient ?? new CharacterClient();
    this.treasureClient = treasureClient ?? new TreasureClient();
  }

  /**
   * Fetch a page of game treasures affordable within the character's current
   * money, for the Acquire tab.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|null} token - Authentication token, if any.
   * @param {{page: number, perPage: number, maxValue: number, search: string,
   *   ordering: string}} params - Browse params. `search` is an optional name filter;
   *   `ordering` (`'asc'`/`'desc'`) is forwarded as-is, always `'desc'` in this modal.
   * @returns {Promise<{data: object[], pagination: object}>} Page of treasures with
   *   pagination metadata.
   */
  fetchAcquirePage(gameSlug, token, params) {
    return this.treasureClient.fetchGameTreasuresPage(gameSlug, token, params)
      .then((response) => this.#parseIndexResponse(response));
  }

  /**
   * Fetch a page of the character's owned treasures, for the Sell tab.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {string|null} token - Authentication token, if any.
   * @param {{page: number, perPage: number, search: string}} params - Browse params.
   *   `search` is an optional name filter.
   * @returns {Promise<{data: object[], pagination: object}>} Page of owned treasures with
   *   pagination metadata.
   */
  fetchSellPage(gameSlug, characterId, isPc, token, params) {
    return this.characterClient.fetchTreasuresPage(
      TreasureExchangeModalController.#characterKind(isPc), gameSlug, characterId, token, params,
    ).then((response) => this.#parseIndexResponse(response));
  }

  /**
   * Submit an acquire request for the given treasure and quantity.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {string|null} token - Authentication token, if any.
   * @param {{treasureId: number, quantity: number}} fields - Acquire request fields.
   * @returns {Promise<object>} Resolves to `{ok: true, quantity, money, acquired}` on success
   *   (`acquired` is the number of units actually acquired in this request, which may be less
   *   than the requested `quantity` when the treasure was capped), or `{ok: false, errorKey}`
   *   on a 400 validation failure.
   */
  acquire(gameSlug, characterId, isPc, token, fields) {
    const body = TreasureExchangeModalController.#toBody(fields);

    return this.characterClient.acquireTreasure(
      TreasureExchangeModalController.#characterKind(isPc), gameSlug, characterId, token, body,
    ).then((response) => this.#parseActionResponse(response));
  }

  /**
   * Submit a sell request for the given treasure and quantity.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {string|null} token - Authentication token, if any.
   * @param {{treasureId: number, quantity: number}} fields - Sell request fields.
   * @returns {Promise<object>} Resolves to `{ok: true, quantity, money}` on success, or
   *   `{ok: false, errorKey}` on a 400 validation failure.
   */
  sell(gameSlug, characterId, isPc, token, fields) {
    const body = TreasureExchangeModalController.#toBody(fields);

    return this.characterClient.sellTreasure(
      TreasureExchangeModalController.#characterKind(isPc), gameSlug, characterId, token, body,
    ).then((response) => this.#parseActionResponse(response));
  }

  static #toBody({ treasureId, quantity }) {
    return { treasure_id: treasureId, quantity };
  }

  static #characterKind(isPc) {
    return isPc ? 'pcs' : 'npcs';
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

  async #parseActionResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (response.status === 200) {
      return {
        ok: true, quantity: data.quantity, money: data.money, acquired: data.acquired,
      };
    }

    return { ok: false, errorKey: TreasureExchangeModalController.#resolveErrorKey(data) };
  }

  static #resolveErrorKey(data) {
    const messages = data.errors?.quantity ?? [];
    return ERROR_KEY_BY_MESSAGE[messages[0]] ?? GENERIC_ERROR_KEY;
  }
}
