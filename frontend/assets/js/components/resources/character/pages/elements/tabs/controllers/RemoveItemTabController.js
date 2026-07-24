import CharacterClient from '../../../../../../../client/CharacterClient.js';
import AuthStorage from '../../../../../../../utils/auth/AuthStorage.js';
import RequestStore from '../../../../../../../utils/requests/RequestStore.js';

const GENERIC_ERROR_KEY = 'item_exchange_modal.generic_error';

/**
 * Default page size for the Remove tab's browse list.
 */
export const PER_PAGE = 10;

/**
 * Manages browsing and submitting remove requests for the item exchange modal's Remove tab.
 *
 * @description `fetchPage` goes through `RequestStore` (`item.collection`, `kind:
 *   'pcs'|'npcs'`) — the existing `items.json`/`items/all.json` pair, auto-elevating for a
 *   dm/admin(/owner for PCs) exactly like the Items page's own list already does. Deliberately
 *   *not* `ownedCollection` (unlike the treasure Remove tab, added by issue #811 specifically to
 *   avoid elevation) — items want elevation for Remove, so no such split is needed here.
 */
export default class RemoveItemTabController {
  /**
   * Create a Remove tab controller.
   *
   * @param {CharacterClient|null} [characterClient] - Character client override.
   */
  constructor(characterClient = null) {
    this.characterClient = characterClient ?? new CharacterClient();
  }

  /**
   * Fetch a page of the character's owned items, through `RequestStore` (`item.collection`,
   * `kind: 'pcs'|'npcs'`) — see this class's own description.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} characterId - Character id.
   * @param {{page: number, perPage: number, search: string}} params - Browse params. `search` is
   *   an optional name filter.
   * @returns {Promise<{data: object[], pagination: object}>} Page of owned items with pagination
   *   metadata.
   */
  fetchPage(gameSlug, kind, characterId, {
    page, perPage, search,
  }) {
    return RequestStore.ensure({
      componentName: 'RemoveItemTabController',
      resource: 'item',
      quantityType: 'collection',
      params: { gameSlug, kind, id: characterId },
      query: { page, per_page: perPage, name: search },
    }).then(({ data, pagination }) => ({ data: Array.isArray(data) ? data : [], pagination }));
  }

  /**
   * Loads one page of the Remove tab's browse list, updating `setBrowse` through the
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

    const kind = RemoveItemTabController.#characterKind(character.is_pc);

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
   * Submit a remove request for the given owned item.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {string|null} token - Authentication token, if any.
   * @param {{gameItemId: number}} fields - Remove request fields.
   * @param {boolean} [canEdit] - Whether the requester can edit the character. When true, submits
   *   through the `items/remove/all.json` endpoint instead of the player-facing one, so removing
   *   a hidden owned item doesn't 404.
   * @returns {Promise<object>} Resolves to `{ok: true}` on success, or `{ok: false, errorKey}`
   *   on failure.
   */
  remove(gameSlug, characterId, isPc, token, fields, canEdit = false) {
    const body = RemoveItemTabController.#toBody(fields);
    const characterKind = RemoveItemTabController.#characterKind(isPc);
    const request = canEdit
      ? this.characterClient.removeItemAll(characterKind, gameSlug, characterId, token, body)
      : this.characterClient.removeItem(characterKind, gameSlug, characterId, token, body);

    return request.then((response) => this.#parseActionResponse(response));
  }

  /**
   * Submits the remove request for the currently selected owned item, then applies the outcome:
   * clearing the selection and reloading the browse page on success (invoking `onSuccess` first),
   * or surfacing the error key otherwise.
   *
   * @param {object} selected - Currently selected browse item (owned `CharacterItem` entry).
   * @param {object} character - Character context (`id`, `game_slug`, `is_pc`, `canEdit`).
   * @param {{setSubmitting: Function, setSelected: Function, setActionError: Function,
   *   onSuccess: Function, reload: Function}} setters - State setters and callbacks: `reload()`
   *   re-fetches the current browse page after a successful remove.
   * @returns {Promise<void>} Resolves once the outcome has been fully applied.
   */
  confirmRemove(selected, character, setters) {
    const gameItemId = selected.game_item_id;
    const token = AuthStorage.getToken();

    setters.setSubmitting(true);

    return this.remove(
      character.game_slug, character.id, character.is_pc, token, { gameItemId }, character.canEdit,
    ).then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setActionError(result.errorKey);
        return;
      }

      setters.setSelected(null);
      setters.onSuccess({ gameItemId });
      setters.reload();
    });
  }

  static #toBody({ gameItemId }) {
    return { game_item_id: gameItemId };
  }

  static #characterKind(isPc) {
    return isPc ? 'pcs' : 'npcs';
  }

  async #parseActionResponse(response) {
    if (response.status === 204) {
      return { ok: true };
    }

    return { ok: false, errorKey: GENERIC_ERROR_KEY };
  }
}
