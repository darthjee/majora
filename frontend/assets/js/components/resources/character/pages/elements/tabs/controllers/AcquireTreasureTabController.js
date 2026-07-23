import CharacterClient from '../../../../../../../client/CharacterClient.js';
import AuthStorage from '../../../../../../../utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../utils/requests/RequestStore.js';
import Translator from '../../../../../../../i18n/Translator.js';

const ERROR_KEY_BY_MESSAGE = {};

const GENERIC_ERROR_KEY = 'treasure_exchange_modal.generic_error';

/**
 * Default page size for the Acquire tab's browse list.
 */
export const PER_PAGE = 10;

/**
 * Builds the query params for an Acquire-tab browse page request: the current name filter,
 * always sorted descending (there is no sort-direction UI toggle). Unlike the Buy tab, the
 * catalog is never filtered by the character's money — there's no `maxValue` key.
 *
 * @param {number} page - Page number to request.
 * @param {number} perPage - Page size.
 * @param {object} character - Character context (unused, kept for signature parity with Buy).
 * @param {string} searchTerm - Current name filter.
 * @returns {object} Query params for {@link AcquireTreasureTabController#fetchPage}.
 */
export function buildBrowseParams(page, perPage, character, searchTerm) {
  return {
    page, perPage, search: searchTerm, ordering: 'desc',
  };
}

/**
 * Builds the partial-fulfillment notice shown above the browse list when an acquire request was
 * capped by the treasure's availability.
 *
 * @param {number} requestedQuantity - Quantity that was requested.
 * @param {number|undefined} acquired - Units actually acquired, per the server response.
 * @returns {string} Translated notice, or an empty string when not applicable.
 */
export function buildPartialNotice(requestedQuantity, acquired) {
  if (typeof acquired !== 'number' || acquired >= requestedQuantity) {
    return '';
  }

  return Translator.t('treasure_exchange_modal.partially_fulfilled')
    .replace('{{acquired}}', acquired)
    .replace('{{requested}}', requestedQuantity);
}

/**
 * Manages browsing and submitting acquire requests for the treasure exchange modal's Acquire
 * tab.
 *
 * @description `fetchPage` goes through `RequestStore` (`treasure.collection`, `kind: 'game'`),
 *   the same resource config used by the Buy tab — just without the `max_value` filter, so the
 *   Acquire tab always lists the full catalog regardless of the character's money.
 */
export default class AcquireTreasureTabController {
  /**
   * Create an Acquire tab controller.
   *
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(characterClient = null) {
    this.characterClient = characterClient ?? new CharacterClient();
  }

  /**
   * Fetch a page of the game's full treasure catalog, through `RequestStore`
   * (`treasure.collection`, `kind: 'game'`) — see this class's own description.
   *
   * @param {string} gameSlug - Game slug.
   * @param {{page: number, perPage: number, search: string, ordering: string}} params - Browse
   *   params. `search` is an optional name filter; `ordering` (`'asc'`/`'desc'`) is forwarded
   *   as-is, always `'desc'` in this modal.
   * @returns {Promise<{data: object[], pagination: object}>} Page of treasures with pagination
   *   metadata.
   */
  fetchPage(gameSlug, {
    page, perPage, search, ordering,
  }) {
    return RequestStore.ensure({
      componentName: 'AcquireTreasureTabController',
      resource: 'treasure',
      quantityType: 'collection',
      params: { gameSlug, kind: 'game' },
      query: {
        page, per_page: perPage, name: search, ordering,
      },
    }).then(({ data, pagination }) => ({ data: Array.isArray(data) ? data : [], pagination }));
  }

  /**
   * Loads one page of the Acquire tab's browse list, updating `setBrowse` through the
   * loading/success/error cycle. Owns the browse-param building, so the component only needs to
   * wire this to its `useState` setter.
   *
   * @param {number} page - Page number to request.
   * @param {object} character - Character context (`game_slug`).
   * @param {string} searchTerm - Current name filter.
   * @param {Function} setBrowse - React state setter for the browse state
   *   (`{items, page, pages, loading, error}`).
   * @returns {Promise<void>} Resolves once `setBrowse` has been called with the outcome.
   */
  loadPage(page, character, searchTerm, setBrowse) {
    setBrowse((prev) => ({ ...prev, loading: true, error: '' }));

    const params = buildBrowseParams(page, PER_PAGE, character, searchTerm);

    return this.fetchPage(character.game_slug, params)
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
   * @param {boolean} [canEdit] - Whether the requester can edit the game (DM/admin). When true,
   *   submits through the `treasures/acquire/all.json` endpoint instead of the player-facing
   *   one, so acquiring a hidden treasure on behalf of the character doesn't 404.
   * @returns {Promise<object>} Resolves to `{ok: true, quantity, money, acquired}` on success
   *   (`acquired` is the number of units actually acquired in this request, which may be less
   *   than the requested `quantity` when the treasure was capped), or `{ok: false, errorKey}` on
   *   a 400 validation failure.
   */
  acquire(gameSlug, characterId, isPc, token, fields, canEdit = false) {
    const body = AcquireTreasureTabController.#toBody(fields);
    const characterKind = AcquireTreasureTabController.#characterKind(isPc);
    const request = canEdit
      ? this.characterClient.acquireTreasureAll(characterKind, gameSlug, characterId, token, body)
      : this.characterClient.acquireTreasure(characterKind, gameSlug, characterId, token, body);

    return request.then((response) => this.#parseActionResponse(response));
  }

  /**
   * Submits the acquire request for the currently selected treasure, then applies the outcome:
   * clearing the selection and reloading the browse page on success (invoking `onSuccess` with
   * the exchange result first), or surfacing the error key otherwise. Owns the whole confirm flow
   * so the component only wires its `useState` setters and `onSuccess` prop through.
   *
   * @param {object} selected - Currently selected browse item.
   * @param {number} quantity - Quantity to acquire for the selected item.
   * @param {object} character - Character context (`id`, `game_slug`, `is_pc`, `canEdit`).
   * @param {{setSubmitting: Function, setSelected: Function, setPartialNotice: Function,
   *   setActionError: Function, onSuccess: Function, reload: Function}} setters - State setters
   *   and callbacks: `reload()` re-fetches the current browse page after a successful acquire.
   * @returns {Promise<void>} Resolves once the outcome has been fully applied.
   */
  confirmAcquire(selected, quantity, character, setters) {
    const treasureId = selected.id;
    const requestedQuantity = quantity;
    const token = AuthStorage.getToken();

    setters.setSubmitting(true);

    return this.acquire(
      character.game_slug, character.id, character.is_pc, token, { treasureId, quantity }, character.canEdit,
    ).then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setActionError(result.errorKey);
        return;
      }

      setters.setSelected(null);
      setters.setPartialNotice(buildPartialNotice(requestedQuantity, result.acquired));
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
      return {
        ok: true, quantity: data.quantity, money: data.money, acquired: data.acquired,
      };
    }

    return { ok: false, errorKey: AcquireTreasureTabController.#resolveErrorKey(data) };
  }

  static #resolveErrorKey(data) {
    const messages = data.errors?.quantity ?? [];
    return ERROR_KEY_BY_MESSAGE[messages[0]] ?? GENERIC_ERROR_KEY;
  }
}
