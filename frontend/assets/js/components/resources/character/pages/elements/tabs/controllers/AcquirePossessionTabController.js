import RequestStore from '../../../../../../../utils/requests/RequestStore.js';

const ERROR_KEY_BY_MESSAGE = {
  game_possession_already_owned: 'possession_exchange_modal.already_owned_error',
};

const GENERIC_ERROR_KEY = 'possession_exchange_modal.generic_error';

/**
 * Default page size for the Acquire tab's browse list.
 */
export const PER_PAGE = 10;

/**
 * Manages browsing and submitting acquire requests for the possession exchange modal's Acquire
 * tab (issue #1076), mirroring `AcquireDocumentTabController` exactly.
 *
 * @description `fetchPage` goes through `RequestStore` (`possession.availableCollection`, `kind:
 *   'pcs'|'npcs'`) — the game's `GamePossession` catalog minus possessions the character already
 *   owns, already excluded server-side, so no client-side "already owned" cross-reference is
 *   needed here, unlike the treasure Acquire tab.
 */
export default class AcquirePossessionTabController {
  /**
   * Fetch a page of the character's Acquire catalog (the game's `GamePossession`s minus
   * already-owned ones), through `RequestStore` (`possession.availableCollection`, `kind:
   * 'pcs'|'npcs'`).
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} characterId - Character id.
   * @param {{page: number, perPage: number, search: string}} params - Browse params. `search` is
   *   an optional name filter.
   * @returns {Promise<{data: object[], pagination: object}>} Page of available game possessions
   *   with pagination metadata.
   */
  fetchPage(gameSlug, kind, characterId, {
    page, perPage, search,
  }) {
    return RequestStore.ensure({
      componentName: 'AcquirePossessionTabController',
      resource: 'possession',
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

    const kind = AcquirePossessionTabController.#characterKind(character.is_pc);

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
   * Submit an acquire request for the given game possession, through `RequestStore.mutate`
   * (`possession.acquire`) so the character's cached possession data is purged on success.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {{gamePossessionId: number, hidden: boolean}} fields - Acquire request fields.
   * @param {boolean} [gameCanEdit] - Whether the requester can edit the game (DM/admin). When
   *   true, submits through the `possessions/acquire/all.json` endpoint instead of the
   *   player-facing one, so acquiring a hidden game possession on behalf of the character doesn't
   *   404.
   * @returns {Promise<object>} Resolves to `{ok: true, characterPossession}` on success (the
   *   acquired `CharacterPossession`'s detail fields), or `{ok: false, errorKey}` on a validation
   *   failure.
   */
  acquire(gameSlug, characterId, isPc, fields, gameCanEdit = false) {
    const body = AcquirePossessionTabController.#toBody(fields);
    const kind = AcquirePossessionTabController.#characterKind(isPc);

    return RequestStore.mutate({
      componentName: 'AcquirePossessionTabController',
      resource: 'possession',
      method: 'POST',
      quantityType: 'acquire',
      params: { gameSlug, kind, id: characterId },
      body,
      variantName: gameCanEdit ? 'private' : 'regular',
    }).then((response) => this.#parseActionResponse(response));
  }

  /**
   * Submits the acquire request for the currently selected game possession, then applies the
   * outcome: purging the possession cache, clearing the selection, and reloading the browse page
   * on success (invoking `onSuccess` with the acquired `CharacterPossession` first), or surfacing
   * the error key otherwise.
   *
   * @param {object} selected - Currently selected browse item (a `GamePossession` catalog entry).
   * @param {boolean} hidden - Whether the acquired `CharacterPossession` should be marked hidden.
   * @param {object} character - Character context (`id`, `game_slug`, `is_pc`, `gameCanEdit`).
   * @param {{setSubmitting: Function, setSelected: Function, setActionError: Function,
   *   onSuccess: Function, reload: Function}} setters - State setters and callbacks: `reload()`
   *   re-fetches the current browse page after a successful acquire.
   * @returns {Promise<void>} Resolves once the outcome has been fully applied.
   */
  confirmAcquire(selected, hidden, character, setters) {
    const gamePossessionId = selected.id;

    setters.setSubmitting(true);

    return this.acquire(
      character.game_slug, character.id, character.is_pc, { gamePossessionId, hidden }, character.gameCanEdit,
    ).then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setActionError(result.errorKey);
        return;
      }

      RequestStore.purge({ resource: 'possession' });
      setters.setSelected(null);
      setters.onSuccess({ gamePossessionId, characterPossession: result.characterPossession });
      setters.reload();
    });
  }

  static #toBody({ gamePossessionId, hidden }) {
    return { game_possession_id: gamePossessionId, hidden };
  }

  static #characterKind(isPc) {
    return isPc ? 'pcs' : 'npcs';
  }

  async #parseActionResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (response.status === 201) {
      return { ok: true, characterPossession: data };
    }

    return { ok: false, errorKey: AcquirePossessionTabController.#resolveErrorKey(data) };
  }

  static #resolveErrorKey(data) {
    const messages = data.errors?.game_possession_id ?? [];
    return ERROR_KEY_BY_MESSAGE[messages[0]] ?? GENERIC_ERROR_KEY;
  }
}
