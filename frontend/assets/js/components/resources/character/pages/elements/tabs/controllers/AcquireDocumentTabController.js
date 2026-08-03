import RequestStore from '../../../../../../../utils/requests/RequestStore.js';

const ERROR_KEY_BY_MESSAGE = {
  'already owned': 'document_exchange_modal.already_owned_error',
};

const GENERIC_ERROR_KEY = 'document_exchange_modal.generic_error';

/**
 * Default page size for the Acquire tab's browse list.
 */
export const PER_PAGE = 10;

/**
 * Manages browsing and submitting acquire requests for the document exchange modal's Acquire tab.
 *
 * @description `fetchPage` goes through `RequestStore` (`document.availableCollection`, `kind:
 *   'pcs'|'npcs'`) — the game's `GameDocument` catalog minus documents the character already
 *   owns, already excluded server-side (see `_document_exchange.py::available`), so no
 *   client-side "already owned" cross-reference is needed here, unlike the treasure Acquire tab.
 */
export default class AcquireDocumentTabController {
  /**
   * Fetch a page of the character's Acquire catalog (the game's `GameDocument`s minus
   * already-owned ones), through `RequestStore` (`document.availableCollection`, `kind:
   * 'pcs'|'npcs'`).
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} characterId - Character id.
   * @param {{page: number, perPage: number, search: string}} params - Browse params. `search` is
   *   an optional name filter.
   * @returns {Promise<{data: object[], pagination: object}>} Page of available game documents
   *   with pagination metadata.
   */
  fetchPage(gameSlug, kind, characterId, {
    page, perPage, search,
  }) {
    return RequestStore.ensure({
      componentName: 'AcquireDocumentTabController',
      resource: 'document',
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

    const kind = AcquireDocumentTabController.#characterKind(character.is_pc);

    return this.fetchPage(character.game_slug, kind, character.id, {
      page, perPage: PER_PAGE, search: searchTerm,
    })
      .then(({ data, pagination }) => setBrowse({
        items: data, page: pagination.page, pages: pagination.pages, loading: false, error: '',
      }))
      .catch(() => setBrowse((prev) => ({
        ...prev, loading: false, error: 'document_exchange_modal.load_error',
      })));
  }

  /**
   * Submit an acquire request for the given game document, through `RequestStore.mutate`
   * (`document.acquire`) so the character's cached document data is purged on success.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {{gameDocumentId: number, hidden: boolean}} fields - Acquire request fields.
   * @param {boolean} [gameCanEdit] - Whether the requester can edit the game (DM/admin). When
   *   true, submits through the `documents/acquire/all.json` endpoint instead of the
   *   player-facing one, so acquiring a hidden game document on behalf of the character doesn't
   *   404.
   * @returns {Promise<object>} Resolves to `{ok: true, characterDocument}` on success (the
   *   acquired `CharacterDocument`'s detail fields), or `{ok: false, errorKey}` on a validation
   *   failure.
   */
  acquire(gameSlug, characterId, isPc, fields, gameCanEdit = false) {
    const body = AcquireDocumentTabController.#toBody(fields);
    const kind = AcquireDocumentTabController.#characterKind(isPc);

    return RequestStore.mutate({
      componentName: 'AcquireDocumentTabController',
      resource: 'document',
      method: 'POST',
      quantityType: 'acquire',
      params: { gameSlug, kind, id: characterId },
      body,
      variantName: gameCanEdit ? 'private' : 'regular',
    }).then((response) => this.#parseActionResponse(response));
  }

  /**
   * Submits the acquire request for the currently selected game document, then applies the
   * outcome: purging the document cache, clearing the selection, and reloading the browse page on
   * success (invoking `onSuccess` with the acquired `CharacterDocument` first), or surfacing the
   * error key otherwise.
   *
   * @param {object} selected - Currently selected browse item (a `GameDocument` catalog entry).
   * @param {boolean} hidden - Whether the acquired `CharacterDocument` should be marked hidden.
   * @param {object} character - Character context (`id`, `game_slug`, `is_pc`, `gameCanEdit`).
   * @param {{setSubmitting: Function, setSelected: Function, setActionError: Function,
   *   onSuccess: Function, reload: Function}} setters - State setters and callbacks: `reload()`
   *   re-fetches the current browse page after a successful acquire.
   * @returns {Promise<void>} Resolves once the outcome has been fully applied.
   */
  confirmAcquire(selected, hidden, character, setters) {
    const gameDocumentId = selected.id;

    setters.setSubmitting(true);

    return this.acquire(
      character.game_slug, character.id, character.is_pc, { gameDocumentId, hidden }, character.gameCanEdit,
    ).then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setActionError(result.errorKey);
        return;
      }

      RequestStore.purge({ resource: 'document' });
      setters.setSelected(null);
      setters.onSuccess({ gameDocumentId, characterDocument: result.characterDocument });
      setters.reload();
    });
  }

  static #toBody({ gameDocumentId, hidden }) {
    return { game_document_id: gameDocumentId, hidden };
  }

  static #characterKind(isPc) {
    return isPc ? 'pcs' : 'npcs';
  }

  async #parseActionResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (response.status === 201) {
      return { ok: true, characterDocument: data };
    }

    return { ok: false, errorKey: AcquireDocumentTabController.#resolveErrorKey(data) };
  }

  static #resolveErrorKey(data) {
    const messages = data.errors?.game_document_id ?? [];
    return ERROR_KEY_BY_MESSAGE[messages[0]] ?? GENERIC_ERROR_KEY;
  }
}
