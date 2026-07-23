import CharacterClient from '../../../../../../../client/CharacterClient.js';
import AuthStorage from '../../../../../../../utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../utils/requests/RequestStore.js';

const ERROR_KEY_BY_MESSAGE = {
  'not enough owned': 'treasure_exchange_modal.not_enough_owned',
};

const GENERIC_ERROR_KEY = 'treasure_exchange_modal.generic_error';

/**
 * Default page size for the Sell tab's browse list.
 */
export const PER_PAGE = 10;

/**
 * Manages browsing and submitting sell requests for the treasure exchange modal's Sell tab.
 *
 * @description `fetchPage` goes through `RequestStore` (`treasure.ownedCollection`, `kind:
 *   'pcs'|'npcs'`) — a resource-config variant added by issue #811 whose `private` path never
 *   elevates to `.../treasures/all.json`, unlike `treasure.collection`'s own `kind: 'npcs'`
 *   branch (which Buy relies on for its "already owned" cross-reference). Routing Sell through
 *   that `collection` entry instead would silently start including hidden treasures for a DM
 *   viewing an NPC's sell list — a real behavior change this class deliberately avoids.
 */
export default class SellTreasureTabController {
  /**
   * Create a Sell tab controller.
   *
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(characterClient = null) {
    this.characterClient = characterClient ?? new CharacterClient();
  }

  /**
   * Fetch a page of the character's owned treasures, through `RequestStore`
   * (`treasure.ownedCollection`, `kind: 'pcs'|'npcs'`) — see this class's own description.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {{page: number, perPage: number, search: string}} params - Browse params. `search` is
   *   an optional name filter.
   * @returns {Promise<{data: object[], pagination: object}>} Page of owned treasures with
   *   pagination metadata.
   */
  fetchPage(gameSlug, characterId, isPc, {
    page, perPage, search,
  }) {
    return RequestStore.ensure({
      componentName: 'SellTreasureTabController',
      resource: 'treasure',
      quantityType: 'ownedCollection',
      params: { gameSlug, kind: SellTreasureTabController.#characterKind(isPc), id: characterId },
      query: { page, per_page: perPage, name: search },
    }).then(({ data, pagination }) => ({ data: Array.isArray(data) ? data : [], pagination }));
  }

  /**
   * Loads one page of the Sell tab's browse list, updating `setBrowse` through the
   * loading/success/error cycle.
   *
   * @param {number} page - Page number to request.
   * @param {object} character - Character context (`game_slug`, `id`, `is_pc`).
   * @param {string} searchTerm - Current name filter.
   * @param {Function} setBrowse - React state setter for the browse state
   *   (`{items, page, pages, loading, error}`).
   * @returns {Promise<void>} Resolves once `setBrowse` has been called with the outcome.
   */
  loadPage(page, character, searchTerm, setBrowse) {
    setBrowse((prev) => ({ ...prev, loading: true, error: '' }));

    return this.fetchPage(character.game_slug, character.id, character.is_pc, {
      page, perPage: PER_PAGE, search: searchTerm,
    })
      .then(({ data, pagination }) => setBrowse({
        items: data, page: pagination.page, pages: pagination.pages, loading: false, error: '',
      }))
      .catch(() => setBrowse((prev) => ({
        ...prev, loading: false, error: 'treasure_exchange_modal.load_error',
      })));
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
    const body = SellTreasureTabController.#toBody(fields);

    return this.characterClient.sellTreasure(
      SellTreasureTabController.#characterKind(isPc), gameSlug, characterId, token, body,
    ).then((response) => this.#parseActionResponse(response));
  }

  /**
   * Submits the sell request for the currently selected owned treasure, then applies the
   * outcome: clearing the selection and reloading the browse page on success (invoking
   * `onSuccess` with the exchange result first), or surfacing the error key otherwise.
   *
   * @param {object} selected - Currently selected browse item (owned treasure entry).
   * @param {number} quantity - Quantity to sell for the selected item.
   * @param {object} character - Character context (`id`, `game_slug`, `is_pc`).
   * @param {{setSubmitting: Function, setSelected: Function, setActionError: Function,
   *   onSuccess: Function, reload: Function}} setters - State setters and callbacks: `reload()`
   *   re-fetches the current browse page after a successful sell.
   * @returns {Promise<void>} Resolves once the outcome has been fully applied.
   */
  confirmSell(selected, quantity, character, setters) {
    const treasureId = selected.treasure_id;
    const token = AuthStorage.getToken();

    setters.setSubmitting(true);

    return this.sell(
      character.game_slug, character.id, character.is_pc, token, { treasureId, quantity },
    ).then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setActionError(result.errorKey);
        return;
      }

      setters.setSelected(null);
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

  async #parseActionResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (response.status === 200) {
      return { ok: true, quantity: data.quantity, money: data.money };
    }

    return { ok: false, errorKey: SellTreasureTabController.#resolveErrorKey(data) };
  }

  static #resolveErrorKey(data) {
    const messages = data.errors?.quantity ?? [];
    return ERROR_KEY_BY_MESSAGE[messages[0]] ?? GENERIC_ERROR_KEY;
  }
}
