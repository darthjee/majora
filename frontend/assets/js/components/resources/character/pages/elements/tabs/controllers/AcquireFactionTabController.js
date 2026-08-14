import RequestStore from '../../../../../../../utils/requests/RequestStore.js';

const ERROR_KEY_BY_MESSAGE = {
  game_faction_already_enlisted: 'faction_exchange_modal.already_enlisted_error',
};

const GENERIC_ERROR_KEY = 'faction_exchange_modal.generic_error';

/**
 * Default page size for the Enlist tab's browse list.
 */
export const PER_PAGE = 10;

/**
 * Manages browsing and submitting acquire requests for the faction exchange modal's Enlist tab
 * (issue #943), mirroring `AcquireDocumentTabController` exactly, minus the "hidden" switch —
 * `GameFaction` has no `hidden` field of its own to default a `CharacterFaction`'s own `hidden`
 * from (unlike `GameDocument`), so this tab always submits `hidden: false`.
 *
 * @description `fetchPage` goes through `RequestStore` (`faction.availableCollection`, `kind:
 *   'pcs'|'npcs'`) — the game's `GameFaction` catalog minus factions the character is already
 *   enlisted in, already excluded server-side, so no client-side "already enlisted" cross-
 *   reference is needed here, unlike the treasure Acquire tab.
 */
export default class AcquireFactionTabController {
  /**
   * Fetch a page of the character's Enlist catalog (the game's `GameFaction`s minus factions the
   * character is already enlisted in), through `RequestStore` (`faction.availableCollection`,
   * `kind: 'pcs'|'npcs'`).
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} characterId - Character id.
   * @param {{page: number, perPage: number, search: string}} params - Browse params. `search` is
   *   an optional name filter.
   * @returns {Promise<{data: object[], pagination: object}>} Page of available game factions with
   *   pagination metadata.
   */
  fetchPage(gameSlug, kind, characterId, {
    page, perPage, search,
  }) {
    return RequestStore.ensure({
      componentName: 'AcquireFactionTabController',
      resource: 'faction',
      quantityType: 'availableCollection',
      params: { gameSlug, kind, id: characterId },
      query: { page, per_page: perPage, name: search },
    }).then(({ data, pagination }) => ({ data: Array.isArray(data) ? data : [], pagination }));
  }

  /**
   * Loads one page of the Enlist tab's browse list, updating `setBrowse` through the
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

    const kind = AcquireFactionTabController.#characterKind(character.is_pc);

    return this.fetchPage(character.game_slug, kind, character.id, {
      page, perPage: PER_PAGE, search: searchTerm,
    })
      .then(({ data, pagination }) => setBrowse({
        items: data, page: pagination.page, pages: pagination.pages, loading: false, error: '',
      }))
      .catch(() => setBrowse((prev) => ({
        ...prev, loading: false, error: 'faction_exchange_modal.load_error',
      })));
  }

  /**
   * Submit an acquire request for the given game faction, through `RequestStore.mutate`
   * (`faction.acquire`) so the character's cached faction data is purged on success. Always
   * submits `hidden: false` — see this class's own description.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Character id.
   * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
   * @param {{gameFactionId: number}} fields - Acquire request fields.
   * @param {boolean} [gameCanEdit] - Whether the requester can edit the game (DM/admin). When
   *   true, submits through the `factions/acquire/all.json` endpoint instead of the player-facing
   *   one, so enlisting the character into a hidden game faction doesn't 404.
   * @returns {Promise<object>} Resolves to `{ok: true, characterFaction}` on success (the
   *   enlisted `CharacterFaction`'s detail fields), or `{ok: false, errorKey}` on a validation
   *   failure.
   */
  acquire(gameSlug, characterId, isPc, fields, gameCanEdit = false) {
    const body = AcquireFactionTabController.#toBody(fields);
    const kind = AcquireFactionTabController.#characterKind(isPc);

    return RequestStore.mutate({
      componentName: 'AcquireFactionTabController',
      resource: 'faction',
      method: 'POST',
      quantityType: 'acquire',
      params: { gameSlug, kind, id: characterId },
      body,
      variantName: gameCanEdit ? 'private' : 'regular',
    }).then((response) => this.#parseActionResponse(response));
  }

  /**
   * Submits the acquire request for the currently selected game faction, then applies the
   * outcome: purging the faction cache, clearing the selection, and reloading the browse page on
   * success (invoking `onSuccess` with the enlisted faction first), or surfacing the error key
   * otherwise.
   *
   * @param {object} selected - Currently selected browse item (a `GameFaction` catalog entry).
   * @param {object} character - Character context (`id`, `game_slug`, `is_pc`, `gameCanEdit`).
   * @param {{setSubmitting: Function, setSelected: Function, setActionError: Function,
   *   onSuccess: Function, reload: Function}} setters - State setters and callbacks: `reload()`
   *   re-fetches the current browse page after a successful acquire.
   * @returns {Promise<void>} Resolves once the outcome has been fully applied.
   */
  confirmAcquire(selected, character, setters) {
    const gameFactionId = selected.id;

    setters.setSubmitting(true);

    return this.acquire(
      character.game_slug, character.id, character.is_pc, { gameFactionId }, character.gameCanEdit,
    ).then((result) => {
      setters.setSubmitting(false);

      if (!result.ok) {
        setters.setActionError(result.errorKey);
        return;
      }

      RequestStore.purge({ resource: 'faction' });
      setters.setSelected(null);
      setters.onSuccess({ gameFactionId, characterFaction: result.characterFaction });
      setters.reload();
    });
  }

  static #toBody({ gameFactionId }) {
    return { game_faction_id: gameFactionId, hidden: false };
  }

  static #characterKind(isPc) {
    return isPc ? 'pcs' : 'npcs';
  }

  async #parseActionResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (response.status === 201) {
      return { ok: true, characterFaction: data };
    }

    return { ok: false, errorKey: AcquireFactionTabController.#resolveErrorKey(data) };
  }

  static #resolveErrorKey(data) {
    const messages = data.errors?.game_faction_id ?? [];
    return ERROR_KEY_BY_MESSAGE[messages[0]] ?? GENERIC_ERROR_KEY;
  }
}
