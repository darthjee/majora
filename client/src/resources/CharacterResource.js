import { GameResource } from './GameResource.js';

/**
 * Shared base for the character families (`npcs` and `pcs`), whose routes are parallel
 * (built by `backend/games/urls/_character_routes.py`).
 *
 * It declares the variants both families share — `get` (`<id>` / `<id>/full`) and `update`
 * (`PATCH <id>` / `PATCH <id>/full`) — that `Npcs` and `Pcs` extend with their own `list`
 * and `create` entries.
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
}
