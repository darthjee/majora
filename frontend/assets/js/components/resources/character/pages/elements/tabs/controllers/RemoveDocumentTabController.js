import RequestStore from '../../../../../../../utils/requests/RequestStore.js';

const GENERIC_ERROR_KEY = 'document_exchange_modal.generic_error';

/**
 * Default page size for the Remove tab's browse list.
 */
export const PER_PAGE = 10;

/**
 * Manages browsing and submitting remove requests for the document exchange modal's Remove tab.
 *
 * @description `fetchPage` goes through `RequestStore` (`document.collection`, `kind:
 *   'pcs'|'npcs'`) — the existing, unmodified `documents.json`/`documents/all.json` pair, already
 *   resolved at the character level by `RequestPermissionResolvers.js`'s `document.collection`
 *   resolver, exactly like the Documents page's own list.
 */
export default class RemoveDocumentTabController {
  /**
   * Fetch a page of the character's owned documents, through `RequestStore`
   * (`document.collection`, `kind: 'pcs'|'npcs'`) — see this class's own description.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} characterId - Character id.
   * @param {{page: number, perPage: number, search: string}} params - Browse params. `search` is
   *   an optional name filter.
   * @returns {Promise<{data: object[], pagination: object}>} Page of owned documents with
   *   pagination metadata.
   */
  fetchPage(gameSlug, kind, characterId, {
    page, perPage, search,
  }) {
    return RequestStore.ensure({
      componentName: 'RemoveDocumentTabController',
      resource: 'document',
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

    const kind = RemoveDocumentTabController.#characterKind(character.is_pc);

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
   * Submit a remove request for the given owned document, through `RequestStore.mutate`
   * (`document.remove`) so the character's cached document data is purged on success.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {{gameDocumentId: number}} fields - Remove request fields.
   * @param {boolean} [canEdit] - Whether the requester can edit the character. When true, submits
   *   through the `documents/remove/all.json` endpoint instead of the player-facing one, so
   *   removing a hidden owned document doesn't 404.
   * @returns {Promise<object>} Resolves to `{ok: true}` on success, or `{ok: false, errorKey}`
   *   on failure.
   */
  remove(gameSlug, characterId, isPc, fields, canEdit = false) {
    const body = RemoveDocumentTabController.#toBody(fields);
    const kind = RemoveDocumentTabController.#characterKind(isPc);

    return RequestStore.mutate({
      componentName: 'RemoveDocumentTabController',
      resource: 'document',
      method: 'POST',
      quantityType: 'remove',
      params: { gameSlug, kind, id: characterId },
      body,
      variantName: canEdit ? 'private' : 'regular',
    }).then((response) => this.#parseActionResponse(response));
  }

  /**
   * Submits the remove request for the currently selected owned document, then applies the
   * outcome: purging the document cache, clearing the selection, and reloading the browse page on
   * success (invoking `onSuccess` first), or surfacing the error key otherwise.
   *
   * @param {object} selected - Currently selected browse item (owned `CharacterDocument` entry).
   * @param {object} character - Character context (`id`, `game_slug`, `is_pc`, `canEdit`).
   * @param {{setSubmitting: Function, setSelected: Function, setActionError: Function,
   *   onSuccess: Function, reload: Function}} setters - State setters and callbacks: `reload()`
   *   re-fetches the current browse page after a successful remove.
   * @returns {Promise<void>} Resolves once the outcome has been fully applied.
   */
  confirmRemove(selected, character, setters) {
    const gameDocumentId = selected.game_document_id;

    setters.setSubmitting(true);

    return this.remove(
      character.game_slug, character.id, character.is_pc, { gameDocumentId }, character.canEdit,
    ).then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setActionError(result.errorKey);
        return;
      }

      RequestStore.purge({ resource: 'document' });
      setters.setSelected(null);
      setters.onSuccess({ gameDocumentId });
      setters.reload();
    });
  }

  static #toBody({ gameDocumentId }) {
    return { game_document_id: gameDocumentId };
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
