import { CharacterLinks } from './CharacterLinks.js';

/**
 * Documents of one character (`games/<slug>/<npcs|pcs>/<character_id>/documents`), reached
 * through `npcs.documents(characterId)` or `pcs.documents(characterId)`.
 *
 * Actions (regular / restricted): `list` (`documents` / `documents/all`, + `iterate`), `get`
 * (`documents/<id>` / `documents/<id>/full`), `available` (`documents/available` /
 * `documents/available/all`, + `iterateAvailable`), `acquire` (`POST documents/acquire` /
 * `documents/acquire/all`) and `remove` (`POST documents/remove` / `documents/remove/all`,
 * target in the body). The document files/photos sub-routes are not wrapped.
 *
 * @example
 * const documents = client.game('epic-quest').pcs.documents(4);
 * await documents.list({ restricted: true });            // pcs/4/documents/all.json
 * await documents.get(7);                                // pcs/4/documents/7.json
 * await documents.acquire({ document_id: 7 });           // POST pcs/4/documents/acquire.json
 * await documents.remove({ document_id: 7 });            // POST pcs/4/documents/remove.json
 */
export class CharacterDocuments extends CharacterLinks {
  static segment = 'documents';

  static variants = {
    list: { regular: '', restricted: 'all' },
    get: { regular: ':id', restricted: ':id/full' },
    available: { regular: 'available', restricted: 'available/all' },
    acquire: { regular: 'acquire', restricted: 'acquire/all' },
    remove: { regular: 'remove', restricted: 'remove/all' },
  };
}
