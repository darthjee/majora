import { GameResource } from './GameResource.js';

/**
 * Factions of a game (`games/<slug>/factions`, scope family `factions`).
 *
 * Actions: `list` (+ `iterate`), `get`, `create`, `update`, with no restricted variant at
 * all: `{ restricted: true }` throws `UsageError`, before any request. There is no `delete`.
 *
 * @example
 * const factions = client.game('epic-quest').factions;
 * await factions.list();                             // factions.json
 * await factions.create({ name: 'Guild' });          // POST factions.json
 */
export class Factions extends GameResource {
  static family = 'factions';

  static variants = {
    list: { regular: '', restricted: null },
    get: { regular: ':id', restricted: null },
    create: { regular: '', restricted: null },
    update: { regular: ':id', restricted: null },
  };
}
