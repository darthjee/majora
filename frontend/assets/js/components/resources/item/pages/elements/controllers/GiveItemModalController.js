import RequestStore from '../../../../../../utils/requests/RequestStore.js';

/**
 * Default page size for the give-item modal's PC/NPC browse list.
 */
export const PER_PAGE = 10;

/**
 * Manages the give-item modal's (issue #827) PC/NPC browse list, the right-side "receiving" list
 * (owned/pending quantities per character), and submission of the pending create requests.
 *
 * @description The browse list reuses the existing `pc.collection`/`npc.collection` endpoints
 *   (server-side `name` search, debounced by the caller — see `GiveItemModal.jsx`), matching
 *   `AcquireItemTabController`'s own browse-pane pattern. The receiving list is keyed by
 *   `kind`+character id (never bare id) since a PC and an NPC in the same game may share an id.
 *   Adding an already-listed character increments its `pendingQuantity` instead of duplicating the
 *   row; adding a new one fetches its current owned quantity once, via the new `item.summary`
 *   `resourceConfig` entry (issue #827). Submission fires `pendingQuantity` `POST .../acquire.json`
 *   calls per listed character, best-effort (a failed call never aborts the others), then
 *   re-fetches that character's summary regardless of outcome so the displayed owned count always
 *   reflects actual server state.
 */
export default class GiveItemModalController {
  /**
   * Fetch a page of a game's PCs or NPCs through `RequestStore` (`pc.collection`/
   * `npc.collection`), with an optional server-side `name` search.
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
      componentName: 'GiveItemModalController',
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
        ...prev, loading: false, error: 'give_item_modal.load_error',
      })));
  }

  /**
   * Fetch how many of `itemId` a character already owns, through `RequestStore` (`item.summary`).
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} itemId - `GameItem` id being given.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} characterId - Character id.
   * @returns {Promise<number>} Resolves to the character's current owned quantity.
   */
  fetchSummary(gameSlug, itemId, kind, characterId) {
    return RequestStore.ensure({
      componentName: 'GiveItemModalController',
      resource: 'item',
      quantityType: 'summary',
      params: {
        gameSlug, itemId, kind, id: characterId,
      },
    }).then(({ data }) => data.quantity ?? 0);
  }

  /**
   * Adds a character to the right-side receiving list, or increments its pending quantity if
   * already listed.
   *
   * @param {object} character - Selected browse-list character (`id`, `name`, ...).
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug.
   * @param {string|number} itemId - `GameItem` id being given.
   * @param {object[]} receiving - Current receiving list.
   * @param {Function} setReceiving - React state setter for the receiving list.
   * @returns {Promise<void>} Resolves once `setReceiving` has been called with the outcome.
   */
  addCharacter(character, kind, gameSlug, itemId, receiving, setReceiving) {
    if (GiveItemModalController.#findRow(receiving, kind, character.id)) {
      setReceiving(GiveItemModalController.incrementPending(receiving, kind, character.id));
      return Promise.resolve();
    }

    return this.fetchSummary(gameSlug, itemId, kind, character.id).then((ownedQuantity) => {
      setReceiving([...receiving, {
        character, kind, ownedQuantity, pendingQuantity: 1, result: null,
      }]);
    });
  }

  /**
   * Increments a row's pending quantity by one.
   *
   * @param {object[]} receiving - Current receiving list.
   * @param {string} kind - Character kind of the row to update.
   * @param {string|number} characterId - Character id of the row to update.
   * @returns {object[]} A new receiving list with the matching row's `pendingQuantity` increased.
   */
  static incrementPending(receiving, kind, characterId) {
    return GiveItemModalController.#mapRow(
      receiving, kind, characterId, (row) => ({ ...row, pendingQuantity: row.pendingQuantity + 1 }),
    );
  }

  /**
   * Decrements a row's pending quantity by one, flooring at 1 (dropping a character entirely is
   * done via {@link GiveItemModalController.removeCharacter} instead).
   *
   * @param {object[]} receiving - Current receiving list.
   * @param {string} kind - Character kind of the row to update.
   * @param {string|number} characterId - Character id of the row to update.
   * @returns {object[]} A new receiving list with the matching row's `pendingQuantity` decreased.
   */
  static decrementPending(receiving, kind, characterId) {
    return GiveItemModalController.#mapRow(
      receiving, kind, characterId,
      (row) => ({ ...row, pendingQuantity: Math.max(1, row.pendingQuantity - 1) }),
    );
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
    return receiving.filter((row) => !GiveItemModalController.#isRow(row, kind, characterId));
  }

  /**
   * Submits the pending create requests for every listed character (best-effort, in parallel per
   * character), then re-fetches each character's summary regardless of outcome, updating the
   * receiving list with the fresh owned quantity and a per-character success/failure result.
   *
   * @param {object[]} receiving - Current receiving list.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} itemId - `GameItem` id being given.
   * @param {boolean} hidden - Whether the created `CharacterItem`s should be marked hidden
   *   (mirrors the given `GameItem`'s own `hidden` value).
   * @param {boolean} canGiveHidden - Whether the requester may act through the DM/admin-only
   *   acquire endpoint (accepting a hidden `GameItem`).
   * @param {{setSubmitting: Function, setReceiving: Function}} setters - State setters.
   * @returns {Promise<void>} Resolves once every in-flight request (acquire calls and the
   *   follow-up summary refetches) has settled and state has been updated.
   */
  submit(receiving, gameSlug, itemId, hidden, canGiveHidden, setters) {
    setters.setSubmitting(true);

    const perCharacter = receiving.map(
      (row) => this.#submitForCharacter(row, gameSlug, itemId, hidden, canGiveHidden),
    );

    return Promise.all(perCharacter).then((results) => {
      setters.setSubmitting(false);
      setters.setReceiving(GiveItemModalController.#applyResults(receiving, results));
    });
  }

  /**
   * Submits a single acquire (`POST .../items/acquire.json`) request, through `RequestStore.mutate`
   * (`item.acquire`) so a successful call purges the item cache. Never rejects — a request that
   * fails (validation error or network failure) resolves to `false`, matching this modal's
   * best-effort submission semantics.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Receiving character id.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} itemId - `GameItem` id being given.
   * @param {boolean} hidden - Whether the created `CharacterItem` should be marked hidden.
   * @param {boolean} canGiveHidden - Whether to submit through the DM/admin-only `private` variant.
   * @returns {Promise<boolean>} Resolves to `true` on a `2xx` response, `false` otherwise.
   */
  acquire(gameSlug, characterId, kind, itemId, hidden, canGiveHidden) {
    return RequestStore.mutate({
      componentName: 'GiveItemModalController',
      resource: 'item',
      method: 'POST',
      quantityType: 'acquire',
      params: { gameSlug, kind, id: characterId },
      body: { game_item_id: itemId, hidden },
      variantName: canGiveHidden ? 'private' : 'regular',
    }).then((response) => response.ok).catch(() => false);
  }

  #submitForCharacter(row, gameSlug, itemId, hidden, canGiveHidden) {
    const { character, kind, pendingQuantity } = row;
    const calls = Array.from(
      { length: pendingQuantity },
      () => this.acquire(gameSlug, character.id, kind, itemId, hidden, canGiveHidden),
    );

    return Promise.all(calls).then((outcomes) => {
      RequestStore.purge({ resource: 'item' });
      const successCount = outcomes.filter(Boolean).length;

      return this.fetchSummary(gameSlug, itemId, kind, character.id).then((ownedQuantity) => ({
        kind,
        characterId: character.id,
        ownedQuantity,
        success: successCount === outcomes.length && outcomes.length > 0,
      }));
    });
  }

  static #applyResults(receiving, results) {
    return receiving.map((row) => {
      const result = results.find((entry) => GiveItemModalController.#isRow(row, entry.kind, entry.characterId));

      if (!result) {
        return row;
      }

      return {
        ...row,
        ownedQuantity: result.ownedQuantity,
        result: result.success ? 'success' : 'failure',
      };
    });
  }

  static #mapRow(receiving, kind, characterId, update) {
    return receiving.map((row) => (
      GiveItemModalController.#isRow(row, kind, characterId) ? update(row) : row
    ));
  }

  static #findRow(receiving, kind, characterId) {
    return receiving.find((row) => GiveItemModalController.#isRow(row, kind, characterId));
  }

  static #isRow(row, kind, characterId) {
    return row.kind === kind && row.character.id === characterId;
  }
}
