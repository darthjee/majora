import RequestStore from '../../../../../../../utils/requests/RequestStore.js';

const GENERIC_ERROR_KEY = 'possession_exchange_modal.generic_error';

/**
 * Default page size for the Remove tab's browse list.
 */
export const PER_PAGE = 10;

/**
 * Manages browsing and submitting remove requests for the possession exchange modal's Remove tab
 * (issue #1076), mirroring `RemoveDocumentTabController` exactly.
 *
 * @description `fetchPage` goes through `RequestStore` (`possession.collection`, `kind:
 *   'pcs'|'npcs'`) — the existing, unmodified `possessions.json`/`possessions/all.json` pair,
 *   already resolved at the character level by `RequestPermissionResolvers.js`'s
 *   `possession.collection` resolver, exactly like the Possessions page's own list.
 */
export default class RemovePossessionTabController {
  /**
   * Fetch a page of the character's owned possessions, through `RequestStore`
   * (`possession.collection`, `kind: 'pcs'|'npcs'`) — see this class's own description.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} characterId - Character id.
   * @param {{page: number, perPage: number, search: string}} params - Browse params. `search` is
   *   an optional name filter.
   * @returns {Promise<{data: object[], pagination: object}>} Page of owned possessions with
   *   pagination metadata.
   */
  fetchPage(gameSlug, kind, characterId, {
    page, perPage, search,
  }) {
    return RequestStore.ensure({
      componentName: 'RemovePossessionTabController',
      resource: 'possession',
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

    const kind = RemovePossessionTabController.#characterKind(character.is_pc);

    return this.fetchPage(character.game_slug, kind, character.id, {
      page, perPage: PER_PAGE, search: searchTerm,
    })
      .then(({ data, pagination }) => setBrowse({
        items: data, page: pagination.page, pages: pagination.pages, loading: false, error: '',
      }))
      .catch(() => setBrowse((prev) => ({
        ...prev, loading: false, error: 'possession_exchange_modal.load_error',
      })));
  }

  /**
   * Submit a remove request for the given owned possession, through `RequestStore.mutate`
   * (`possession.remove`) so the character's cached possession data is purged on success.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {{gamePossessionId: number}} fields - Remove request fields.
   * @param {boolean} [canEdit] - Whether the requester can edit the character. When true, submits
   *   through the `possessions/remove/all.json` endpoint instead of the player-facing one, so
   *   removing a hidden owned possession doesn't 404.
   * @returns {Promise<object>} Resolves to `{ok: true}` on success, or `{ok: false, errorKey}`
   *   on failure.
   */
  remove(gameSlug, characterId, isPc, fields, canEdit = false) {
    const body = RemovePossessionTabController.#toBody(fields);
    const kind = RemovePossessionTabController.#characterKind(isPc);

    return RequestStore.mutate({
      componentName: 'RemovePossessionTabController',
      resource: 'possession',
      method: 'POST',
      quantityType: 'remove',
      params: { gameSlug, kind, id: characterId },
      body,
      variantName: canEdit ? 'private' : 'regular',
    }).then((response) => this.#parseActionResponse(response));
  }

  /**
   * Submits the remove request for the currently selected owned possession, then applies the
   * outcome: purging the possession cache, clearing the selection, and reloading the browse page
   * on success (invoking `onSuccess` first), or surfacing the error key otherwise.
   *
   * @param {object} selected - Currently selected browse item (owned `CharacterPossession` entry).
   * @param {object} character - Character context (`id`, `game_slug`, `is_pc`, `canEdit`).
   * @param {{setSubmitting: Function, setSelected: Function, setActionError: Function,
   *   onSuccess: Function, reload: Function}} setters - State setters and callbacks: `reload()`
   *   re-fetches the current browse page after a successful remove.
   * @returns {Promise<void>} Resolves once the outcome has been fully applied.
   */
  confirmRemove(selected, character, setters) {
    const gamePossessionId = selected.game_possession_id;

    setters.setSubmitting(true);

    return this.remove(
      character.game_slug, character.id, character.is_pc, { gamePossessionId }, character.canEdit,
    ).then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setActionError(result.errorKey);
        return;
      }

      RequestStore.purge({ resource: 'possession' });
      setters.setSelected(null);
      setters.onSuccess({ gamePossessionId });
      setters.reload();
    });
  }

  static #toBody({ gamePossessionId }) {
    return { game_possession_id: gamePossessionId };
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
