import { GameResource } from './GameResource.js';
import { PHOTO_UPLOAD_VARIANT, uploadPhoto } from './photoPath.js';
import { SUMMARY_VARIANT, fetchSummary } from './summaryPath.js';

/**
 * Items of a game (`games/<slug>/items`, scope family `items`).
 *
 * Actions: `list` (+ `iterate`), `get`, `create`, `update`. Restricted variants exist
 * for `list` (`items/all`) and `get` (`items/<id>/full`): a restricted `create` or `update`
 * throws `UsageError`, before any request. There is no `delete`. `summary(id, kind,
 * characterId)` reads the per-character summary (`items/<id>/<pcs|npcs>/<character_id>/summary`,
 * `summary/all` when restricted).
 *
 * Photo: `uploadPhoto(id, file)` (a single photo, replaced in place), with no restricted
 * variant; there is no set-as-main nor photo deletion.
 *
 * @example
 * const items = client.game('epic-quest').items;
 * await items.list({ restricted: true });          // items/all.json
 * await items.get(7, { restricted: true });        // items/7/full.json
 * await items.update(7, { name: 'New name' });     // PATCH items/7.json
 * await items.summary(7, 'pcs', 4);            // items/7/pcs/4/summary.json
 * await items.uploadPhoto(7, blob);            // POST items/7/photo_upload.json + submit
 */
export class Items extends GameResource {
  static family = 'items';

  static variants = {
    list: { regular: '', restricted: 'all' },
    get: { regular: ':id', restricted: ':id/full' },
    create: { regular: '', restricted: null },
    update: { regular: ':id', restricted: null },
    summary: SUMMARY_VARIANT,
    photoUpload: PHOTO_UPLOAD_VARIANT,
  };

  /**
   * Fetches the summary of one item for one character
   * (`GET items/<id>/<pcs|npcs>/<character_id>/summary`, `/summary/all` when restricted).
   * @param {string|number} itemId - The item id.
   * @param {string} kind - The character family: `'pcs'` or `'npcs'`.
   * @param {string|number} characterId - The character id.
   * @param {object} [options] - Request options (see `Resource#get`).
   * @param {boolean} [options.restricted] - Use the restricted variant (`summary/all`).
   * @returns {Promise<unknown>} The parsed body (one object).
   * @throws {import('../core/errors/UsageError.js').UsageError} When `kind` is not `'pcs'` /
   *   `'npcs'` or an id is blank.
   */
  async summary(itemId, kind, characterId, options = {}) {
    return fetchSummary(this, itemId, kind, characterId, options);
  }

  /**
   * Uploads a photo in one call: `POST items/<id>/photo_upload.json`, then
   * `POST uploads/image/<upload_id>/submit` (multipart, field `file`, header
   * `X-Upload-Token`). See `photoPath.js#uploadPhoto` for the options.
   * @param {string|number} itemId - The item id.
   * @param {Blob|Uint8Array} file - A `Blob` / `File`, or a `Buffer` / `Uint8Array` (then
   *   `options.filename` is required).
   * @param {object} [options] - Upload options (`filename`, `contentType`, `timeout` of the
   *   submit step, default 120000, `headers`, `signal`).
   * @returns {Promise<unknown>} The submit body (`{ file_path }`).
   * @throws {import('../core/errors/UsageError.js').UsageError} On a restricted variant, a
   *   blank id or an invalid file, before any request.
   */
  async uploadPhoto(itemId, file, options = {}) {
    return uploadPhoto(this, itemId, file, options);
  }
}
