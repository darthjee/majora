import { Resource, encodeSegment } from './Resource.js';

/**
 * Pages of one document (`games/<slug>/documents/<document_id>/pages`, scope family
 * `documents`), reached through `documents.pages(documentId)`.
 *
 * Actions: `list` (+ `iterate`), `create`, `update`, plus `trim(keep)` (bulk delete of every
 * page with `order > keep`) and `bumpVersion(data)`. Every action has a regular and a
 * restricted (`all`) variant. There is no `get` and no per-page `delete`: the backend has
 * neither, so `get` throws `UsageError`, before any request.
 *
 * @example
 * const pages = client.game('epic-quest').documents.pages(7);
 * await pages.list({ restricted: true });                    // GET documents/7/pages/all.json
 * await pages.create({ content, order: 1, version: 2 });     // POST documents/7/pages.json
 * await pages.update(12, { content, version: 2 });           // PATCH documents/7/pages/12.json
 * await pages.trim(3);                                       // DELETE documents/7/pages.json {keep: 3}
 * await pages.bumpVersion({ version: 2, exclude_ids: [12] }); // PATCH documents/7/pages/bump_version.json
 */
export class DocumentPages extends Resource {
  static variants = {
    list: { regular: '', restricted: 'all' },
    create: { regular: '', restricted: 'all' },
    update: { regular: ':id', restricted: ':id/all' },
    trim: { regular: '', restricted: 'all' },
    bumpVersion: { regular: 'bump_version', restricted: 'bump_version/all' },
  };

  #documentId;

  /**
   * Builds the wrapper.
   * @param {import('../core/HttpClient.js').HttpClient} http - The HTTP layer.
   * @param {import('../core/Paginator.js').Paginator} paginator - The paginator.
   * @param {string} documentsBasePath - Base path of the parent `Documents` wrapper (already
   *   URL-encoded, e.g. `games/epic-quest/documents`).
   * @param {string|number} documentId - The document id.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the document id is blank.
   */
  constructor(http, paginator, documentsBasePath, documentId) {
    super(
      http,
      paginator,
      `${documentsBasePath}/${encodeSegment(documentId, 'document id')}/pages`,
    );
    this.#documentId = documentId;
  }

  /**
   * The document id this wrapper is bound to.
   * @returns {string|number} The document id.
   */
  get documentId() {
    return this.#documentId;
  }

  /**
   * Archives then deletes every page with `order > keep` (`DELETE` with body `{ keep }`,
   * never retried). The API answers `204` with no body.
   * @param {number} keep - How many pages to keep.
   * @param {object} [options] - Request options.
   * @param {boolean} [options.restricted] - Use the restricted variant.
   * @param {object} [options.headers] - Extra request headers.
   * @param {number} [options.timeout] - Timeout per attempt in ms.
   * @param {AbortSignal} [options.signal] - Caller abort signal.
   * @returns {Promise<unknown>} The parsed body (no meaningful value).
   */
  async trim(keep, options = {}) {
    const { restricted, ...rest } = options;
    const path = this.pathFor('trim', { restricted });
    const { body } = await this.http.delete(path, { ...rest, body: { keep } });

    return body;
  }

  /**
   * Bumps the version of the document's pages (`PATCH bump_version`, never retried). The
   * body is sent as-is; the API answers `200` with an empty body.
   * @param {object} data - The body, e.g. `{ version: 2, exclude_ids: [12] }`.
   * @param {object} [options] - Request options (see `trim`).
   * @returns {Promise<unknown>} The parsed body (no meaningful value).
   */
  async bumpVersion(data, options = {}) {
    const { restricted, ...rest } = options;
    const path = this.pathFor('bumpVersion', { restricted });
    const { body } = await this.http.patch(path, data, rest);

    return body;
  }
}
