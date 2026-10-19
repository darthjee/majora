import { GameResource } from './GameResource.js';

/**
 * Documents of a game (`games/<slug>/documents`, scope family `documents`).
 *
 * Actions: `list` (+ `iterate`), `get`, `create`, `update`. Restricted variants exist
 * for `list` (`documents/all`) and `get` (`documents/<id>/full`) only: a restricted `create` or
 * `update` throws `UsageError`, before any request. There is no `delete`.
 *
 * @example
 * const documents = client.game('epic-quest').documents;
 * await documents.list({ restricted: true });          // documents/all.json
 * await documents.get(7, { restricted: true });        // documents/7/full.json
 * await documents.update(7, { name: 'New name' });     // PATCH documents/7.json
 */
export class Documents extends GameResource {
  static family = 'documents';

  static variants = {
    list: { regular: '', restricted: 'all' },
    get: { regular: ':id', restricted: ':id/full' },
    create: { regular: '', restricted: null },
    update: { regular: ':id', restricted: null },
  };
}
