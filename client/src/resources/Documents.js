import { DocumentPages } from './DocumentPages.js';
import { GameResource } from './GameResource.js';

/**
 * Documents of a game (`games/<slug>/documents`, scope family `documents`).
 *
 * Actions: `list` (+ `iterate`), `get`, `create`, `update`, and `pages(id)` for the pages
 * of one document (see `DocumentPages`). Restricted variants exist
 * for `list` (`documents/all`) and `get` (`documents/<id>/full`) only: a restricted `create` or
 * `update` throws `UsageError`, before any request. There is no `delete`.
 *
 * @example
 * const documents = client.game('epic-quest').documents;
 * await documents.list({ restricted: true });          // documents/all.json
 * await documents.get(7, { restricted: true });        // documents/7/full.json
 * await documents.update(7, { name: 'New name' });     // PATCH documents/7.json
 * await documents.pages(7).list();                     // documents/7/pages.json
 */
export class Documents extends GameResource {
  static family = 'documents';

  static variants = {
    list: { regular: '', restricted: 'all' },
    get: { regular: ':id', restricted: ':id/full' },
    create: { regular: '', restricted: null },
    update: { regular: ':id', restricted: null },
  };

  /**
   * Builds the wrapper for the pages of one document.
   * @param {string|number} documentId - The document id.
   * @returns {DocumentPages} The pages wrapper, bound to that document.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the id is blank.
   */
  pages(documentId) {
    return new DocumentPages(this.http, this.paginator, this.basePath, documentId);
  }
}
