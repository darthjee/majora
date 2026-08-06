import RequestStore from '../../../../../../utils/requests/RequestStore.js';
import Translator from '../../../../../../i18n/Translator.js';

/**
 * Default page size for the give-treasure modal's PC/NPC browse list.
 */
export const PER_PAGE = 10;

/**
 * Manages the give-treasure modal's (issue #1001) PC/NPC browse list, the right-side "receiving"
 * list (owned/pending quantities per character), and submission of the pending acquire requests.
 *
 * @description Mirrors `GiveItemModalController`'s browse/receiving-list plumbing (server-side
 *   `name`-searched `pc.collection`/`npc.collection` browse, rows keyed by `kind`+character id).
 *   Unlike items, `CharacterTreasure` already carries a `quantity` field, so submission fires a
 *   **single** `POST .../acquire.json` per row with `{treasure_id, quantity: pendingQuantity}`,
 *   best-effort, then re-fetches that character's summary regardless of outcome. The response's
 *   `acquired` field is compared against the requested `pendingQuantity` to surface a per-row
 *   partial-fulfillment notice — the residual race after the client-side pool cap enforced by
 *   {@link GiveTreasureModalController.incrementPending}.
 */
export default class GiveTreasureModalController {
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
      componentName: 'GiveTreasureModalController',
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
        ...prev, loading: false, error: 'give_treasure_modal.load_error',
      })));
  }

  /**
   * Fetch how many of `treasureId` a character already owns, through `RequestStore`
   * (`treasure.summary`).
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} treasureId - `Treasure` id being given.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} characterId - Character id.
   * @returns {Promise<number>} Resolves to the character's current owned quantity.
   */
  fetchSummary(gameSlug, treasureId, kind, characterId) {
    return RequestStore.ensure({
      componentName: 'GiveTreasureModalController',
      resource: 'treasure',
      quantityType: 'summary',
      params: {
        gameSlug, treasureId, kind, id: characterId,
      },
    }).then(({ data }) => data.quantity ?? 0);
  }

  /**
   * Adds a character to the receiving list, or increments its pending quantity (cap-checked, see
   * {@link GiveTreasureModalController.incrementPending}) if already listed.
   *
   * @param {object} character - Selected browse-list character (`id`, `name`, ...).
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug.
   * @param {string|number} treasureId - `Treasure` id being given.
   * @param {object[]} receiving - Current receiving list.
   * @param {Function} setReceiving - React state setter for the receiving list.
   * @param {number|null} [availableUnits] - Live pool cap across every receiving row, or `null`
   *   for unlimited.
   * @returns {Promise<void>} Resolves once `setReceiving` has been called with the outcome.
   */
  addCharacter(character, kind, gameSlug, treasureId, receiving, setReceiving, availableUnits = null) {
    if (GiveTreasureModalController.#findRow(receiving, kind, character.id)) {
      setReceiving(GiveTreasureModalController.incrementPending(receiving, kind, character.id, availableUnits));
      return Promise.resolve();
    }

    return this.fetchSummary(gameSlug, treasureId, kind, character.id).then((ownedQuantity) => {
      setReceiving([...receiving, {
        character, kind, ownedQuantity, pendingQuantity: 1, result: null, partialNotice: '',
      }]);
    });
  }

  /**
   * Sums the pending quantity across every receiving-list row.
   *
   * @param {object[]} receiving - Current receiving list.
   * @returns {number} Total pending quantity across every row.
   */
  static totalPending(receiving) {
    return receiving.reduce((sum, row) => sum + row.pendingQuantity, 0);
  }

  /**
   * Increments a row's pending quantity by one, refusing to once the running total across every
   * row would exceed `availableUnits` (skipped when `null`, meaning an uncapped treasure).
   *
   * @param {object[]} receiving - Current receiving list.
   * @param {string} kind - Character kind of the row to update.
   * @param {string|number} characterId - Character id of the row to update.
   * @param {number|null} [availableUnits] - Live pool cap across every receiving row, or `null`
   *   for unlimited.
   * @returns {object[]} A new receiving list with the matching row's `pendingQuantity` increased,
   *   or the same list unchanged when the pool cap has already been reached.
   */
  static incrementPending(receiving, kind, characterId, availableUnits = null) {
    if (availableUnits !== null && availableUnits !== undefined
      && GiveTreasureModalController.totalPending(receiving) >= availableUnits) {
      return receiving;
    }

    return GiveTreasureModalController.#mapRow(
      receiving, kind, characterId, (row) => ({ ...row, pendingQuantity: row.pendingQuantity + 1 }),
    );
  }

  /**
   * Decrements a row's pending quantity by one, flooring at 1 (dropping a character entirely is
   * done via {@link GiveTreasureModalController.removeCharacter} instead).
   *
   * @param {object[]} receiving - Current receiving list.
   * @param {string} kind - Character kind of the row to update.
   * @param {string|number} characterId - Character id of the row to update.
   * @returns {object[]} A new receiving list with the matching row's `pendingQuantity` decreased.
   */
  static decrementPending(receiving, kind, characterId) {
    return GiveTreasureModalController.#mapRow(
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
    return receiving.filter((row) => !GiveTreasureModalController.#isRow(row, kind, characterId));
  }

  /**
   * Submits one acquire request per listed character (quantity = the row's `pendingQuantity`),
   * best-effort, then re-fetches each character's summary regardless of outcome, updating the
   * receiving list with the fresh owned quantity, a success/failure result, and a
   * partial-fulfillment notice when the server granted fewer units than requested.
   *
   * @param {object[]} receiving - Current receiving list.
   * @param {string} gameSlug - Game slug.
   * @param {string|number} treasureId - `Treasure` id being given.
   * @param {boolean} canGiveHidden - Whether the requester may act through the DM/admin-only
   *   acquire endpoint (accepting a hidden `Treasure`).
   * @param {{setSubmitting: Function, setReceiving: Function}} setters - State setters.
   * @returns {Promise<void>} Resolves once every request has settled and state has been updated.
   */
  submit(receiving, gameSlug, treasureId, canGiveHidden, setters) {
    setters.setSubmitting(true);

    const perCharacter = receiving.map(
      (row) => this.#submitForCharacter(row, gameSlug, treasureId, canGiveHidden),
    );

    return Promise.all(perCharacter).then((results) => {
      setters.setSubmitting(false);
      setters.setReceiving(GiveTreasureModalController.#applyResults(receiving, results));
    });
  }

  /**
   * Submits a single acquire (`POST .../treasures/acquire.json`) request, through
   * `RequestStore.mutate` (`treasure.acquire`), purging the treasure cache on success. Never
   * rejects — a failed request resolves to `{ok: false, acquired: 0}`.
   *
   * @param {string} gameSlug - Game slug.
   * @param {string|number} characterId - Receiving character id.
   * @param {string} kind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string|number} treasureId - `Treasure` id being given.
   * @param {number} quantity - Quantity requested for this character.
   * @param {boolean} canGiveHidden - Whether to submit through the DM/admin-only `private` variant.
   * @returns {Promise<{ok: boolean, acquired: number}>} `ok`: whether the request succeeded;
   *   `acquired`: units actually granted (may be less than `quantity` when the pool was exhausted).
   */
  acquire(gameSlug, characterId, kind, treasureId, quantity, canGiveHidden) {
    return RequestStore.mutate({
      componentName: 'GiveTreasureModalController',
      resource: 'treasure',
      method: 'POST',
      quantityType: 'acquire',
      params: { gameSlug, kind, id: characterId },
      body: { treasure_id: treasureId, quantity },
      variantName: canGiveHidden ? 'private' : 'regular',
    }).then((response) => GiveTreasureModalController.#parseResponse(response))
      .catch(() => ({ ok: false, acquired: 0 }));
  }

  #submitForCharacter(row, gameSlug, treasureId, canGiveHidden) {
    const { character, kind, pendingQuantity } = row;

    return this.acquire(gameSlug, character.id, kind, treasureId, pendingQuantity, canGiveHidden)
      .then((result) => {
        RequestStore.purge({ resource: 'treasure' });

        return this.fetchSummary(gameSlug, treasureId, kind, character.id).then((ownedQuantity) => ({
          kind,
          characterId: character.id,
          ownedQuantity,
          success: result.ok,
          partialNotice: result.ok
            ? GiveTreasureModalController.#buildPartialNotice(pendingQuantity, result.acquired, character.name)
            : '',
        }));
      });
  }

  static async #parseResponse(response) {
    const data = await response.json().catch(() => ({}));

    return { ok: response.ok, acquired: data.acquired };
  }

  static #buildPartialNotice(requestedQuantity, acquired, name) {
    if (typeof acquired !== 'number' || acquired >= requestedQuantity) {
      return '';
    }

    return Translator.t('give_treasure_modal.partially_fulfilled')
      .replace('{{acquired}}', acquired)
      .replace('{{requested}}', requestedQuantity)
      .replace('{{name}}', name);
  }

  static #applyResults(receiving, results) {
    return receiving.map((row) => {
      const result = results.find(
        (entry) => GiveTreasureModalController.#isRow(row, entry.kind, entry.characterId),
      );

      if (!result) {
        return row;
      }

      return {
        ...row,
        ownedQuantity: result.ownedQuantity,
        result: result.success ? 'success' : 'failure',
        partialNotice: result.partialNotice,
      };
    });
  }

  static #mapRow(receiving, kind, characterId, update) {
    return receiving.map((row) => (
      GiveTreasureModalController.#isRow(row, kind, characterId) ? update(row) : row
    ));
  }

  static #findRow(receiving, kind, characterId) {
    return receiving.find((row) => GiveTreasureModalController.#isRow(row, kind, characterId));
  }

  static #isRow(row, kind, characterId) {
    return row.kind === kind && row.character.id === characterId;
  }
}
