import { CharacterLinks } from './CharacterLinks.js';

/**
 * Factions of one character (`games/<slug>/<npcs|pcs>/<character_id>/factions`), reached
 * through `npcs.factions(characterId)` or `pcs.factions(characterId)`.
 *
 * Actions (regular / restricted): `list` (`factions` / `factions/all`, + `iterate`), `get`
 * (`factions/<id>` / `factions/<id>/full`), `available` (`factions/available` /
 * `factions/available/all`, + `iterateAvailable`), `acquire` (`POST factions/acquire` /
 * `factions/acquire/all`) and `remove(factionId, data?)` (`POST factions/<id>/remove` /
 * `factions/<id>/remove/all`): unlike items and documents, the removal is per faction.
 *
 * @example
 * const factions = client.game('epic-quest').npcs.factions(12);
 * await factions.list();                                 // npcs/12/factions.json
 * await factions.available({ restricted: true });        // npcs/12/factions/available/all.json
 * await factions.acquire({ faction_id: 5 });             // POST npcs/12/factions/acquire.json
 * await factions.remove(5);                              // POST npcs/12/factions/5/remove.json
 */
export class CharacterFactions extends CharacterLinks {
  static segment = 'factions';

  static variants = {
    list: { regular: '', restricted: 'all' },
    get: { regular: ':id', restricted: ':id/full' },
    available: { regular: 'available', restricted: 'available/all' },
    acquire: { regular: 'acquire', restricted: 'acquire/all' },
    remove: { regular: ':id/remove', restricted: ':id/remove/all' },
  };

  /**
   * Removes the character from one faction (`POST factions/<id>/remove`, never retried).
   * The body is sent as-is.
   * @param {string|number} factionId - The faction id.
   * @param {object} [data] - The body (defaults to `{}`).
   * @param {object} [options] - Request options (see `CharacterLinks#acquire`).
   * @returns {Promise<unknown>} The parsed body.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the faction id is blank.
   */
  async remove(factionId, data = {}, options = {}) {
    const { restricted, ...rest } = options;
    const path = this.pathFor('remove', { restricted, id: factionId });
    const { body } = await this.http.post(path, data, rest);

    return body;
  }
}
