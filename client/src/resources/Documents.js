import { DocumentPages } from './DocumentPages.js';
import { GameResource } from './GameResource.js';
import {
  PHOTO_SET_VARIANT, PHOTO_UPLOAD_VARIANT, setMainPhoto, uploadPhoto,
} from './photoPath.js';
import { SUMMARY_VARIANT, fetchSummary } from './summaryPath.js';

/**
 * Documents of a game (`games/<slug>/documents`, scope family `documents`).
 *
 * Actions: `list` (+ `iterate`), `get`, `create`, `update`, and `pages(id)` for the pages
 * of one document (see `DocumentPages`). Restricted variants exist
 * for `list` (`documents/all`) and `get` (`documents/<id>/full`): a restricted `create` or
 * `update` throws `UsageError`, before any request. There is no `delete`. `summary(id, kind,
 * characterId)` reads the per-character summary
 * (`documents/<id>/<pcs|npcs>/<character_id>/summary`, `summary/all` when restricted).
 * Photos: `uploadPhoto(id, file)` and `setMainPhoto(id, photoId)`, with no restricted
 * variant; there is no photo deletion.
 *
 * @example
 * const documents = client.game('epic-quest').documents;
 * await documents.list({ restricted: true });          // documents/all.json
 * await documents.get(7, { restricted: true });        // documents/7/full.json
 * await documents.update(7, { name: 'New name' });     // PATCH documents/7.json
 * await documents.pages(7).list();                     // documents/7/pages.json
 * await documents.summary(7, 'npcs', 12);              // documents/7/npcs/12/summary.json
 * await documents.uploadPhoto(7, blob);                // POST documents/7/photo_upload.json + submit
 * await documents.setMainPhoto(7, 3);                  // PATCH documents/7/photos/3/set.json
 */
export class Documents extends GameResource {
  static family = 'documents';

  static variants = {
    list: { regular: '', restricted: 'all' },
    get: { regular: ':id', restricted: ':id/full' },
    create: { regular: '', restricted: null },
    update: { regular: ':id', restricted: null },
    summary: SUMMARY_VARIANT,
    photoUpload: PHOTO_UPLOAD_VARIANT,
    photoSet: PHOTO_SET_VARIANT,
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

  /**
   * Fetches the summary of one document for one character
   * (`GET documents/<id>/<pcs|npcs>/<character_id>/summary`, `/summary/all` when restricted).
   * @param {string|number} documentId - The document id.
   * @param {string} kind - The character family: `'pcs'` or `'npcs'`.
   * @param {string|number} characterId - The character id.
   * @param {object} [options] - Request options (see `Resource#get`).
   * @param {boolean} [options.restricted] - Use the restricted variant (`summary/all`).
   * @returns {Promise<unknown>} The parsed body (one object).
   * @throws {import('../core/errors/UsageError.js').UsageError} When `kind` is not `'pcs'` /
   *   `'npcs'` or an id is blank.
   */
  async summary(documentId, kind, characterId, options = {}) {
    return fetchSummary(this, documentId, kind, characterId, options);
  }

  /**
   * Uploads a photo in one call: `POST documents/<id>/photo_upload.json`, then
   * `POST uploads/image/<upload_id>/submit` (multipart, field `file`, header
   * `X-Upload-Token`). See `photoPath.js#uploadPhoto` for the options.
   * @param {string|number} documentId - The document id.
   * @param {Blob|Uint8Array} file - A `Blob` / `File`, or a `Buffer` / `Uint8Array` (then
   *   `options.filename` is required).
   * @param {object} [options] - Upload options (`filename`, `contentType`, `timeout` of the
   *   submit step, default 120000, `headers`, `signal`).
   * @returns {Promise<unknown>} The submit body (`{ file_path }`).
   * @throws {import('../core/errors/UsageError.js').UsageError} On a restricted variant, a
   *   blank id or an invalid file, before any request.
   */
  async uploadPhoto(documentId, file, options = {}) {
    return uploadPhoto(this, documentId, file, options);
  }

  /**
   * Sets a photo as the main one (`PATCH documents/<id>/photos/<photo_id>/set.json`).
   * @param {string|number} documentId - The document id.
   * @param {string|number} photoId - The photo id.
   * @param {object} [options] - Request options (see `Resource#get`).
   * @returns {Promise<unknown>} The parsed body.
   * @throws {import('../core/errors/UsageError.js').UsageError} On a restricted variant or a
   *   blank id, before any request.
   */
  async setMainPhoto(documentId, photoId, options = {}) {
    return setMainPhoto(this, documentId, photoId, options);
  }
}
