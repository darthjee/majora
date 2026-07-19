import CharacterClient from '../../../../../../client/CharacterClient.js';
import TreasureClient from '../../../../../../client/TreasureClient.js';
import AuthStorage from '../../../../../../utils/auth/AuthStorage.js';
import parsePositiveInt from '../../../../../../utils/parsePositiveInt.js';
import Translator from '../../../../../../i18n/Translator.js';

const ERROR_KEY_BY_MESSAGE = {
  'insufficient funds': 'treasure_exchange_modal.insufficient_funds',
  'not enough owned': 'treasure_exchange_modal.not_enough_owned',
};

const GENERIC_ERROR_KEY = 'treasure_exchange_modal.generic_error';

/**
 * Default page size for the modal's browse list, shared by every `loadPage` call.
 */
export const PER_PAGE = 10;

/**
 * Builds the query params for a browse page request, forwarding the current
 * name filter to both tabs and capping/sorting the Acquire tab (by the
 * character's current money and always descending, per the modal's fixed
 * sort — there is no sort-direction UI toggle).
 *
 * @param {string} tab - Currently active tab (`acquire` or `sell`).
 * @param {number} page - Page number to request.
 * @param {number} perPage - Page size.
 * @param {object} character - Character context (`money`).
 * @param {string} searchTerm - Current name filter.
 * @returns {object} Query params for the matching controller fetch method.
 */
export function buildBrowseParams(tab, page, perPage, character, searchTerm) {
  if (tab === 'acquire') {
    return {
      page, perPage, maxValue: character.money, search: searchTerm, ordering: 'desc',
    };
  }

  return { page, perPage, search: searchTerm };
}

/**
 * Builds the partial-fulfillment notice shown above the browse list when an
 * acquire request was capped by the treasure's availability.
 *
 * @param {string} activeTab - Currently active tab (`acquire` or `sell`).
 * @param {number} requestedQuantity - Quantity that was requested.
 * @param {number|undefined} acquired - Units actually acquired, per the server response.
 * @returns {string} Translated notice, or an empty string when not applicable.
 */
export function buildPartialNotice(activeTab, requestedQuantity, acquired) {
  if (activeTab !== 'acquire' || typeof acquired !== 'number' || acquired >= requestedQuantity) {
    return '';
  }

  return Translator.t('treasure_exchange_modal.partially_fulfilled')
    .replace('{{acquired}}', acquired)
    .replace('{{requested}}', requestedQuantity);
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
   * @param {boolean} [canEdit] - Whether the requester can edit the game (DM/admin). When
   *   true, browses the full catalog (including hidden treasures) through the `treasures/all.json`
   *   endpoint instead of the player-facing, hidden-filtered one.
   * @returns {Promise<{data: object[], pagination: object}>} Page of treasures with
   *   pagination metadata.
   */
  fetchAcquirePage(gameSlug, token, params, canEdit = false) {
    const request = canEdit
      ? this.treasureClient.fetchGameTreasuresAllPage(gameSlug, token, params)
      : this.treasureClient.fetchGameTreasuresPage(gameSlug, token, params);

    return request.then((response) => this.#parseIndexResponse(response));
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
   * Loads one page of the browse list for the given tab (Acquire or Sell), updating `setBrowse`
   * through the loading/success/error cycle. Owns the tab-to-fetch-method dispatch and browse
   * param building, so the modal component only needs to wire this to its `useState` setter.
   *
   * @param {string} tab - Tab to load (`'acquire'` or `'sell'`).
   * @param {number} page - Page number to request.
   * @param {object} character - Character context (`id`, `game_slug`, `is_pc`, `money`, `canEdit`).
   * @param {string} searchTerm - Current name filter.
   * @param {Function} setBrowse - React state setter for the browse state
   *   (`{items, page, pages, loading, error}`).
   * @returns {Promise<void>} Resolves once `setBrowse` has been called with the outcome.
   */
  loadPage(tab, page, character, searchTerm, setBrowse) {
    setBrowse((prev) => ({ ...prev, loading: true, error: '' }));

    const token = AuthStorage.getToken();
    const params = buildBrowseParams(tab, page, PER_PAGE, character, searchTerm);
    const request = tab === 'acquire'
      ? this.fetchAcquirePage(character.game_slug, token, params, character.canEdit)
      : this.fetchSellPage(character.game_slug, character.id, character.is_pc, token, params);

    return request
      .then(({ data, pagination }) => setBrowse({
        items: data, page: pagination.page, pages: pagination.pages, loading: false, error: '',
      }))
      .catch(() => setBrowse((prev) => ({
        ...prev, loading: false, error: 'treasure_exchange_modal.load_error',
      })));
  }

  /**
   * Submit an acquire request for the given treasure and quantity.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {string|null} token - Authentication token, if any.
   * @param {{treasureId: number, quantity: number}} fields - Acquire request fields.
   * @param {boolean} [canEdit] - Whether the requester can edit the game (DM/admin). When
   *   true, submits through the `treasures/acquire/all.json` endpoint instead of the
   *   player-facing one, so acquiring a hidden treasure on behalf of the character doesn't 404.
   * @returns {Promise<object>} Resolves to `{ok: true, quantity, money, acquired}` on success
   *   (`acquired` is the number of units actually acquired in this request, which may be less
   *   than the requested `quantity` when the treasure was capped), or `{ok: false, errorKey}`
   *   on a 400 validation failure.
   */
  acquire(gameSlug, characterId, isPc, token, fields, canEdit = false) {
    const body = TreasureExchangeModalController.#toBody(fields);
    const characterKind = TreasureExchangeModalController.#characterKind(isPc);
    const request = canEdit
      ? this.characterClient.acquireTreasureAll(characterKind, gameSlug, characterId, token, body)
      : this.characterClient.acquireTreasure(characterKind, gameSlug, characterId, token, body);

    return request.then((response) => this.#parseActionResponse(response));
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

  /**
   * Submits the acquire/sell request for the currently selected treasure, dispatching to
   * {@link TreasureExchangeModalController#acquire}/{@link TreasureExchangeModalController#sell}
   * per the active tab, then applying the outcome: clearing the selection and reloading the
   * browse page on success (invoking `onSuccess` with the exchange result first), or surfacing
   * the error key otherwise. Owns the whole confirm flow so the modal component only wires its
   * `useState` setters and `onSuccess` prop through.
   *
   * @param {string} activeTab - Currently active tab (`'acquire'` or `'sell'`).
   * @param {object} selected - Currently selected browse item.
   * @param {number} quantity - Quantity to acquire/sell for the selected item.
   * @param {object} character - Character context (`id`, `game_slug`, `is_pc`, `canEdit`).
   * @param {{setSubmitting: Function, setSelected: Function, setPartialNotice: Function,
   *   setActionError: Function, onSuccess: Function, reload: Function}} setters - State setters
   *   and callbacks: `reload()` re-fetches the current browse page after a successful exchange.
   * @returns {Promise<void>} Resolves once the outcome has been fully applied.
   */
  confirmExchange(activeTab, selected, quantity, character, setters) {
    const treasureId = activeTab === 'acquire' ? selected.id : selected.treasure_id;
    const requestedQuantity = quantity;
    const token = AuthStorage.getToken();
    const submit = activeTab === 'acquire'
      ? this.acquire(
        character.game_slug, character.id, character.is_pc, token, { treasureId, quantity }, character.canEdit,
      )
      : this.sell(character.game_slug, character.id, character.is_pc, token, { treasureId, quantity });

    setters.setSubmitting(true);

    return submit.then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setActionError(result.errorKey);
        return;
      }

      setters.setSelected(null);
      setters.setPartialNotice(buildPartialNotice(activeTab, requestedQuantity, result.acquired));
      setters.onSuccess({
        treasureId,
        treasureInfo: { name: selected.name, value: selected.value, photo_path: selected.photo_path },
        quantity: result.quantity,
        money: result.money,
        acquired: result.acquired,
      });
      setters.reload();
    });
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
