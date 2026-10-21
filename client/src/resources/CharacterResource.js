import { CharacterDocuments } from './CharacterDocuments.js';
import { CharacterFactions } from './CharacterFactions.js';
import { CharacterItems } from './CharacterItems.js';
import { GameResource } from './GameResource.js';

/**
 * Shared base for the character families (`npcs` and `pcs`), whose routes are parallel
 * (built by `backend/games/urls/_character_routes.py`).
 *
 * It declares the variants both families share — `get` (`<id>` / `<id>/full`) and `update`
 * (`PATCH <id>` / `PATCH <id>/full`) — that `Npcs` and `Pcs` extend with their own `list`
 * and `create` entries, and the bound link sub-wrappers `items(id)`, `documents(id)` and
 * `factions(id)`.
 *
 * @example
 * const npcs = client.game('epic-quest').npcs;
 * await npcs.items(12).available();                    // npcs/12/items/available.json
 * await npcs.documents(12).acquire({ document_id: 7 }); // POST npcs/12/documents/acquire.json
 * await npcs.factions(12).remove(5);                   // POST npcs/12/factions/5/remove.json
 */
export class CharacterResource extends GameResource {
  /**
   * Variants shared by every character family.
   * @type {Object<string, {regular: (string|null), restricted: (string|null)}>}
   */
  static variants = {
    get: { regular: ':id', restricted: ':id/full' },
    update: { regular: ':id', restricted: ':id/full' },
  };

  /**
   * Builds the wrapper for the items of one character.
   * @param {string|number} characterId - The character id.
   * @returns {CharacterItems} The items wrapper, bound to that character.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the id is blank.
   */
  items(characterId) {
    return new CharacterItems(this.http, this.paginator, this.basePath, characterId);
  }

  /**
   * Builds the wrapper for the documents of one character.
   * @param {string|number} characterId - The character id.
   * @returns {CharacterDocuments} The documents wrapper, bound to that character.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the id is blank.
   */
  documents(characterId) {
    return new CharacterDocuments(this.http, this.paginator, this.basePath, characterId);
  }

  /**
   * Builds the wrapper for the factions of one character.
   * @param {string|number} characterId - The character id.
   * @returns {CharacterFactions} The factions wrapper, bound to that character.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the id is blank.
   */
  factions(characterId) {
    return new CharacterFactions(this.http, this.paginator, this.basePath, characterId);
  }
}
