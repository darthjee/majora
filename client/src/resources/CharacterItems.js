import { CharacterLinks } from './CharacterLinks.js';

/**
 * Items of one character (`games/<slug>/<npcs|pcs>/<character_id>/items`), reached through
 * `npcs.items(characterId)` or `pcs.items(characterId)`.
 *
 * Actions (regular / restricted): `list` (`items` / `items/all`, + `iterate`), `get`
 * (`items/<id>` / `items/<id>/full`), `available` (`items/available` /
 * `items/available/all`, + `iterateAvailable`), `acquire` (`POST items/acquire` /
 * `items/acquire/all`) and `remove` (`POST items/remove` / `items/remove/all`, target in the
 * body). Item create/update and photo upload are not wrapped.
 *
 * @example
 * const items = client.game('epic-quest').npcs.items(12);
 * await items.list();                                    // npcs/12/items.json
 * await items.get(3, { restricted: true });              // npcs/12/items/3/full.json
 * await items.available();                               // npcs/12/items/available.json
 * await items.acquire({ game_item_id: 3 });              // POST npcs/12/items/acquire.json
 * await items.remove({ game_item_id: 3 }, { restricted: true }); // POST npcs/12/items/remove/all.json
 */
export class CharacterItems extends CharacterLinks {
  static segment = 'items';

  static variants = {
    list: { regular: '', restricted: 'all' },
    get: { regular: ':id', restricted: ':id/full' },
    available: { regular: 'available', restricted: 'available/all' },
    acquire: { regular: 'acquire', restricted: 'acquire/all' },
    remove: { regular: 'remove', restricted: 'remove/all' },
  };
}
