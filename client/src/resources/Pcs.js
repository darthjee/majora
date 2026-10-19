import { CharacterResource } from './CharacterResource.js';

/**
 * PCs of a game (`games/<slug>/pcs`, scope family `pcs`).
 *
 * Actions: `list` (+ `iterate`), `get`, `update`. The API has no PC create route, so
 * `create` throws `UsageError`; there is no `delete`. Restricted variants exist for `get`
 * (`pcs/<id>/full`) and `update` (`PATCH pcs/<id>/full`) only: `list({ restricted: true })`
 * throws `UsageError`, before any request.
 *
 * @example
 * const pcs = client.game('epic-quest').pcs;
 * await pcs.list();                                  // pcs.json
 * await pcs.get(3, { restricted: true });            // pcs/3/full.json
 * await pcs.update(3, data);                         // PATCH pcs/3.json
 */
export class Pcs extends CharacterResource {
  static family = 'pcs';

  static variants = {
    ...CharacterResource.variants,
    list: { regular: '', restricted: null },
  };
}
