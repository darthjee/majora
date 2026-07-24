import CharacterClient from '../../../../../../../client/CharacterClient.js';
import AuthStorage from '../../../../../../../utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../utils/requests/RequestStore.js';

const ERROR_KEY_BY_MESSAGE = {
  'already owned': 'item_exchange_modal.already_owned_error',
};

const GENERIC_ERROR_KEY = 'item_exchange_modal.generic_error';

/**
 * Default page size for the Acquire tab's browse list.
 */
export const PER_PAGE = 10;

/**
 * Manages browsing and submitting acquire requests for the item exchange modal's Acquire tab.
 *
 * @description `fetchPage` goes through `RequestStore` (`item.availableCollection`, `kind:
 *   'pcs'|'npcs'`) — the game's `GameItem` catalog minus items the character already owns,
 *   already excluded server-side (see `_item_exchange.py::character_items_available`), so no
 *   client-side "already owned" cross-reference is needed here, unlike the treasure Acquire tab.
 */
export default class AcquireItemTabController {
  /**
   * Create an Acquire tab controller.
   *
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(characterClient = null) {
    this.characterClient = characterClient ?? new CharacterClient();
  }

  /**
   * Fetch a page of the character's Acquire catalog (the game's `GameItem`s minus already-owned
   * ones), through `RequestStore` (`item.availableCollection`, `kind: 'pcs'|'npcs'`).
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} characterId - Character id.
   * @param {{page: number, perPage: number, search: string}} params - Browse params. `search` is
   *   an optional name filter.
   * @returns {Promise<{data: object[], pagination: object}>} Page of available game items with
   *   pagination metadata.
   */
  fetchPage(gameSlug, kind, characterId, {
    page, perPage, search,
  }) {
    return RequestStore.ensure({
      componentName: 'AcquireItemTabController',
      resource: 'item',
      quantityType: 'availableCollection',
      params: { gameSlug, kind, id: characterId },
      query: { page, per_page: perPage, name: search },
    }).then(({ data, pagination }) => ({ data: Array.isArray(data) ? data : [], pagination }));
  }

  /**
   * Loads one page of the Acquire tab's browse list, updating `setBrowse` through the
   * loading/success/error cycle. Owns the browse-param building, so the component only needs to
   * wire this to its `useState` setter.
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

    const kind = AcquireItemTabController.#characterKind(character.is_pc);

    return this.fetchPage(character.game_slug, kind, character.id, {
      page, perPage: PER_PAGE, search: searchTerm,
    })
      .then(({ data, pagination }) => setBrowse({
        items: data, page: pagination.page, pages: pagination.pages, loading: false, error: '',
      }))
      .catch(() => setBrowse((prev) => ({
        ...prev, loading: false, error: 'item_exchange_modal.load_error',
      })));
  }

  /**
   * Submit an acquire request for the given game item.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {string|null} token - Authentication token, if any.
   * @param {{gameItemId: number, hidden: boolean}} fields - Acquire request fields.
   * @param {boolean} [gameCanEdit] - Whether the requester can edit the game (DM/admin). When
   *   true, submits through the `items/acquire/all.json` endpoint instead of the player-facing
   *   one, so acquiring a hidden game item on behalf of the character doesn't 404.
   * @returns {Promise<object>} Resolves to `{ok: true, characterItem}` on success (the acquired
   *   `CharacterItem`'s detail fields), or `{ok: false, errorKey}` on a 400 validation failure.
   */
  acquire(gameSlug, characterId, isPc, token, fields, gameCanEdit = false) {
    const body = AcquireItemTabController.#toBody(fields);
    const characterKind = AcquireItemTabController.#characterKind(isPc);
    const request = gameCanEdit
      ? this.characterClient.acquireItemAll(characterKind, gameSlug, characterId, token, body)
      : this.characterClient.acquireItem(characterKind, gameSlug, characterId, token, body);

    return request.then((response) => this.#parseActionResponse(response));
  }

  /**
   * Submits the acquire request for the currently selected game item, then applies the outcome:
   * clearing the selection and reloading the browse page on success (invoking `onSuccess` with
   * the acquired `CharacterItem` first), or surfacing the error key otherwise.
   *
   * @param {object} selected - Currently selected browse item (a `GameItem` catalog entry).
   * @param {boolean} hidden - Whether the acquired `CharacterItem` should be marked hidden.
   * @param {object} character - Character context (`id`, `game_slug`, `is_pc`, `gameCanEdit`).
   * @param {{setSubmitting: Function, setSelected: Function, setActionError: Function,
   *   onSuccess: Function, reload: Function}} setters - State setters and callbacks: `reload()`
   *   re-fetches the current browse page after a successful acquire.
   * @returns {Promise<void>} Resolves once the outcome has been fully applied.
   */
  confirmAcquire(selected, hidden, character, setters) {
    const gameItemId = selected.id;
    const token = AuthStorage.getToken();

    setters.setSubmitting(true);

    return this.acquire(
      character.game_slug, character.id, character.is_pc, token, { gameItemId, hidden }, character.gameCanEdit,
    ).then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setActionError(result.errorKey);
        return;
      }

      setters.setSelected(null);
      setters.onSuccess({ gameItemId, characterItem: result.characterItem });
      setters.reload();
    });
  }

  static #toBody({ gameItemId, hidden }) {
    return { game_item_id: gameItemId, hidden };
  }

  static #characterKind(isPc) {
    return isPc ? 'pcs' : 'npcs';
  }

  async #parseActionResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (response.status === 201) {
      return { ok: true, characterItem: data };
    }

    return { ok: false, errorKey: AcquireItemTabController.#resolveErrorKey(data) };
  }

  static #resolveErrorKey(data) {
    const messages = data.errors?.game_item_id ?? [];
    return ERROR_KEY_BY_MESSAGE[messages[0]] ?? GENERIC_ERROR_KEY;
  }
}
