import RequestStore from '../../../../../../utils/requests/RequestStore.js';

/**
 * Default page size for the recruit modal's PC/NPC browse list.
 */
export const PER_PAGE = 10;

/**
 * Manages the recruit modal's (issue #943) PC/NPC browse list, the right-side "receiving" list
 * (enlisted/pending state per character), and submission of the pending acquire requests. A 1:1
 * structural mirror of `GiveDocumentModalController` (`document` → `faction`, `owned` → `enlisted`,
 * `documentId` → `factionId`).
 *
 * @description Mirrors `GiveDocumentModalController`'s browse/receiving-list plumbing (server-side
 *   `name`-searched `pc.collection`/`npc.collection` browse, rows keyed by `kind`+character id),
 *   with the quantity concept dropped entirely — `CharacterFaction` is a plain
 *   `unique_together('character', 'game_faction')` join, so enlistment is boolean. Clicking an
 *   already-listed character is a no-op (no pending quantity to increment). Submission fires one
 *   `POST .../acquire.json` per **non-enlisted** row only, filtered client-side before any request
 *   is sent — already-enlisted rows are left untouched in the list, never re-triggering a request
 *   (the backend's existing 422 "already enlisted" response is a safety net only).
 */
export default class RecruitModalController {
  /**
   * Fetch a page of a game's PCs or NPCs through `RequestStore`, with an optional `name` search.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {{page: number, perPage: number, search: string}} params - Browse params. `search` is
   *   an optional name filter.
   * @returns {Promise<{data: object[], pagination: object}>} Page of characters with pagination
   *   metadata.
   */
  fetchCharacterPage(gameSlug, kind, { page, perPage, search }) {
    const resource = kind === 'pcs' ? 'pc' : 'npc';

    return RequestStore.ensure({
      componentName: 'RecruitModalController',
      resource,
      quantityType: 'collection',
      params: { gameSlug },
      query: { page, per_page: perPage, name: search },
    }).then(({ data, pagination }) => ({ data: Array.isArray(data) ? data : [], pagination }));
  }

  /**
   * Loads one page of the browse list, updating `setBrowse` through the loading/success/error
   * cycle.
   *
   * @param {number} page - Page number to request.
   * @param {string} gameSlug - Game slug.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} searchTerm - Current name filter.
   * @param {Function} setBrowse - React state setter for the browse state
   *   (`{items, page, pages, loading, error}`).
   * @returns {Promise<void>} Resolves once `setBrowse` has been called with the outcome.
   */
  loadPage(page, gameSlug, kind, searchTerm, setBrowse) {
    setBrowse((prev) => ({ ...prev, loading: true, error: '' }));

    return this.fetchCharacterPage(gameSlug, kind, { page, perPage: PER_PAGE, search: searchTerm })
      .then(({ data, pagination }) => setBrowse({
        items: data, page: pagination.page, pages: pagination.pages, loading: false, error: '',
      }))
      .catch(() => setBrowse((prev) => ({
        ...prev, loading: false, error: 'recruit_modal.load_error',
      })));
  }

  /**
   * Fetch whether a character is already enlisted in `factionId`, through `RequestStore`
   * (`faction.summary`).
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} factionId - `GameFaction` id being recruited into.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} characterId - Character id.
   * @returns {Promise<boolean>} Resolves to whether the character is already enlisted.
   */
  fetchSummary(gameSlug, factionId, kind, characterId) {
    return RequestStore.ensure({
      componentName: 'RecruitModalController',
      resource: 'faction',
      quantityType: 'summary',
      params: {
        gameSlug, factionId, kind, id: characterId,
      },
    }).then(({ data }) => data.enlisted ?? false);
  }

  /**
   * Adds a character to the receiving list, fetching its current enlistment once. A repeat click
   * on an already-listed character is a no-op — unlike `GiveTreasureModalController`, there is no
   * pending quantity to increment.
   *
   * @param {object} character - Selected browse-list character (`id`, `name`, ...).
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug.
   * @param {string|number} factionId - `GameFaction` id being recruited into.
   * @param {object[]} receiving - Current receiving list.
   * @param {Function} setReceiving - React state setter for the receiving list.
   * @returns {Promise<void>} Resolves once `setReceiving` has been called with the outcome, or
   *   immediately when the character is already listed.
   */
  addCharacter(character, kind, gameSlug, factionId, receiving, setReceiving) {
    if (RecruitModalController.#findRow(receiving, kind, character.id)) {
      return Promise.resolve();
    }

    return this.fetchSummary(gameSlug, factionId, kind, character.id).then((enlisted) => {
      setReceiving([...receiving, {
        character, kind, enlisted, result: null,
      }]);
    });
  }

  /**
   * Removes a character from the receiving list entirely.
   *
   * @param {object[]} receiving - Current receiving list.
   * @param {string} kind - Character kind of the row to remove.
   * @param {string|number} characterId - Character id of the row to remove.
   * @returns {object[]} A new receiving list without the matching row.
   */
  static removeCharacter(receiving, kind, characterId) {
    return receiving.filter((row) => !RecruitModalController.#isRow(row, kind, characterId));
  }

  /**
   * Submits one acquire request per **non-enlisted** listed character, best-effort, then
   * re-fetches each such character's summary regardless of outcome, updating the receiving list
   * with the fresh enlistment and a success/failure result. Already-enlisted rows are left
   * untouched — never submitted, never re-fetched.
   *
   * @param {object[]} receiving - Current receiving list.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} factionId - `GameFaction` id being recruited into.
   * @param {boolean} canRecruitHidden - Whether the requester may act through the DM/admin-only
   *   acquire endpoint (accepting a hidden `GameFaction`).
   * @param {{setSubmitting: Function, setReceiving: Function}} setters - State setters.
   * @returns {Promise<void>} Resolves once every request has settled and state has been updated.
   */
  submit(receiving, gameSlug, factionId, canRecruitHidden, setters) {
    setters.setSubmitting(true);

    const perCharacter = receiving
      .filter((row) => !row.enlisted)
      .map((row) => this.#submitForCharacter(row, gameSlug, factionId, canRecruitHidden));

    return Promise.all(perCharacter).then((results) => {
      setters.setSubmitting(false);
      setters.setReceiving(RecruitModalController.#applyResults(receiving, results));
    });
  }

  /**
   * Submits a single acquire (`POST .../factions/acquire.json`) request, through
   * `RequestStore.mutate` (`faction.acquire`), purging the faction cache on success. Never
   * rejects — a failed request resolves to `false`.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Receiving character id.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} factionId - `GameFaction` id being recruited into.
   * @param {boolean} canRecruitHidden - Whether to submit through the DM/admin-only `private`
   *   variant.
   * @returns {Promise<boolean>} Whether the request succeeded.
   */
  acquire(gameSlug, characterId, kind, factionId, canRecruitHidden) {
    return RequestStore.mutate({
      componentName: 'RecruitModalController',
      resource: 'faction',
      method: 'POST',
      quantityType: 'acquire',
      params: { gameSlug, kind, id: characterId },
      body: { game_faction_id: factionId, hidden: false },
      variantName: canRecruitHidden ? 'private' : 'regular',
    }).then((response) => response.ok)
      .catch(() => false);
  }

  #submitForCharacter(row, gameSlug, factionId, canRecruitHidden) {
    const { character, kind } = row;

    return this.acquire(gameSlug, character.id, kind, factionId, canRecruitHidden)
      .then((success) => {
        RequestStore.purge({ resource: 'faction' });

        return this.fetchSummary(gameSlug, factionId, kind, character.id).then((enlisted) => ({
          kind, characterId: character.id, enlisted, success,
        }));
      });
  }

  static #applyResults(receiving, results) {
    return receiving.map((row) => {
      const result = results.find(
        (entry) => RecruitModalController.#isRow(row, entry.kind, entry.characterId),
      );

      if (!result) {
        return row;
      }

      return {
        ...row,
        enlisted: result.enlisted,
        result: result.success ? 'success' : 'failure',
      };
    });
  }

  static #findRow(receiving, kind, characterId) {
    return receiving.find((row) => RecruitModalController.#isRow(row, kind, characterId));
  }

  static #isRow(row, kind, characterId) {
    return row.kind === kind && row.character.id === characterId;
  }
}
