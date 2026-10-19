import { GameResource } from './GameResource.js';

/**
 * Items of a game (`games/<slug>/items`, scope family `items`).
 *
 * Actions: `list` (+ `iterate`), `get`, `create`, `update`. Restricted variants exist
 * for `list` (`items/all`) and `get` (`items/<id>/full`) only: a restricted `create` or
 * `update` throws `UsageError`, before any request. There is no `delete`.
 *
 * @example
 * const items = client.game('epic-quest').items;
 * await items.list({ restricted: true });          // items/all.json
 * await items.get(7, { restricted: true });        // items/7/full.json
 * await items.update(7, { name: 'New name' });     // PATCH items/7.json
 */
export class Items extends GameResource {
  static family = 'items';

  static variants = {
    list: { regular: '', restricted: 'all' },
    get: { regular: ':id', restricted: ':id/full' },
    create: { regular: '', restricted: null },
    update: { regular: ':id', restricted: null },
  };
}
