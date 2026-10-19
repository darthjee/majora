import { CharacterResource } from './CharacterResource.js';

/**
 * NPCs of a game (`games/<slug>/npcs`, scope family `npcs`).
 *
 * Actions: `list` (+ `iterate`), `get`, `create`, `update`; every one of them has a
 * restricted variant (`npcs/all`, `npcs/<id>/full`, `POST npcs/full`, `PATCH npcs/<id>/full`).
 * There is no `delete`.
 *
 * @example
 * const npcs = client.game('epic-quest').npcs;
 * await npcs.list({ page: 2 });                        // npcs.json?page=2
 * await npcs.get(12, { restricted: true });            // npcs/12/full.json
 * await npcs.create({ name: 'Bob' });                  // POST npcs.json
 * await npcs.update(12, data, { restricted: true });   // PATCH npcs/12/full.json
 */
export class Npcs extends CharacterResource {
  static family = 'npcs';

  static variants = {
    ...CharacterResource.variants,
    list: { regular: '', restricted: 'all' },
    create: { regular: '', restricted: 'full' },
  };
}
