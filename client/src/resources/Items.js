import { GameResource } from './GameResource.js';
import { SUMMARY_VARIANT, fetchSummary } from './summaryPath.js';

/**
 * Items of a game (`games/<slug>/items`, scope family `items`).
 *
 * Actions: `list` (+ `iterate`), `get`, `create`, `update`. Restricted variants exist
 * for `list` (`items/all`) and `get` (`items/<id>/full`): a restricted `create` or `update`
 * throws `UsageError`, before any request. There is no `delete`. `summary(id, kind,
 * characterId)` reads the per-character summary (`items/<id>/<pcs|npcs>/<character_id>/summary`,
 * `summary/all` when restricted).
 *
 * @example
 * const items = client.game('epic-quest').items;
 * await items.list({ restricted: true });          // items/all.json
 * await items.get(7, { restricted: true });        // items/7/full.json
 * await items.update(7, { name: 'New name' });     // PATCH items/7.json
 * await items.summary(7, 'pcs', 4);            // items/7/pcs/4/summary.json
 */
export class Items extends GameResource {
  static family = 'items';

  static variants = {
    list: { regular: '', restricted: 'all' },
    get: { regular: ':id', restricted: ':id/full' },
    create: { regular: '', restricted: null },
    update: { regular: ':id', restricted: null },
    summary: SUMMARY_VARIANT,
  };

  /**
   * Fetches the summary of one item for one character
   * (`GET items/<id>/<pcs|npcs>/<character_id>/summary`, `/summary/all` when restricted).
   * @param {string|number} itemId - The item id.
   * @param {string} kind - The character family: `'pcs'` or `'npcs'`.
   * @param {string|number} characterId - The character id.
   * @param {object} [options] - Request options (see `Resource#get`).
   * @param {boolean} [options.restricted] - Use the restricted variant (`summary/all`).
   * @returns {Promise<unknown>} The parsed body (one object).
   * @throws {import('../core/errors/UsageError.js').UsageError} When `kind` is not `'pcs'` /
   *   `'npcs'` or an id is blank.
   */
  async summary(itemId, kind, characterId, options = {}) {
    return fetchSummary(this, itemId, kind, characterId, options);
  }
}
