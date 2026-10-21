import { GameResource } from './GameResource.js';
import { PHOTO_UPLOAD_VARIANT, uploadPhoto } from './photoPath.js';
import { SUMMARY_VARIANT, fetchSummary } from './summaryPath.js';

/**
 * Factions of a game (`games/<slug>/factions`, scope family `factions`).
 *
 * Actions: `list` (+ `iterate`), `get`, `create`, `update`, with no restricted variant:
 * `{ restricted: true }` throws `UsageError`, before any request. There is no `delete`.
 * Related lists: `characters(id)` (+ `iterateCharacters`), the faction members, and
 * `summary(id, kind, characterId)`; both have a restricted (`all`) variant.
 *
 * Photo: `uploadPhoto(id, file)` (a single photo, replaced in place), with no restricted
 * variant; there is no set-as-main nor photo deletion.
 *
 * @example
 * const factions = client.game('epic-quest').factions;
 * await factions.list();                             // factions.json
 * await factions.create({ name: 'Guild' });          // POST factions.json
 * await factions.characters(5, { restricted: true }); // factions/5/characters/all.json
 * await factions.summary(5, 'npcs', 12);             // factions/5/npcs/12/summary.json
 * await factions.uploadPhoto(5, blob);               // POST factions/5/photo_upload.json + submit
 */
export class Factions extends GameResource {
  static family = 'factions';

  static variants = {
    list: { regular: '', restricted: null },
    get: { regular: ':id', restricted: null },
    create: { regular: '', restricted: null },
    update: { regular: ':id', restricted: null },
    characters: { regular: ':id/characters', restricted: ':id/characters/all' },
    summary: SUMMARY_VARIANT,
    photoUpload: PHOTO_UPLOAD_VARIANT,
  };

  /**
   * Fetches one page of the members of a faction (`factions/<id>/characters`,
   * `factions/<id>/characters/all` when restricted).
   * @param {string|number} factionId - The faction id.
   * @param {object} [options] - List options (see `Resource#list`).
   * @param {boolean} [options.restricted] - Use the restricted variant.
   * @returns {Promise<import('../core/Page.js').Page>} The page.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the id is blank.
   */
  async characters(factionId, options = {}) {
    const { restricted, ...rest } = options;

    return this.paginator.list(this.pathFor('characters', { restricted, id: factionId }), rest);
  }

  /**
   * Iterates over every member of a faction, one page at a time. The path is resolved
   * immediately, so a blank id throws `UsageError` synchronously, before any request.
   * @param {string|number} factionId - The faction id.
   * @param {object} [options] - List options (see `characters`); `page` sets the first page.
   * @returns {AsyncGenerator<unknown>} The characters.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the id is blank.
   */
  iterateCharacters(factionId, options = {}) {
    const { restricted, ...rest } = options;

    return this.paginator.iterate(this.pathFor('characters', { restricted, id: factionId }), rest);
  }

  /**
   * Fetches the summary of one faction for one character
   * (`GET factions/<id>/<pcs|npcs>/<character_id>/summary`, `/summary/all` when restricted).
   * @param {string|number} factionId - The faction id.
   * @param {string} kind - The character family: `'pcs'` or `'npcs'`.
   * @param {string|number} characterId - The character id.
   * @param {object} [options] - Request options (see `Resource#get`).
   * @param {boolean} [options.restricted] - Use the restricted variant (`summary/all`).
   * @returns {Promise<unknown>} The parsed body (one object).
   * @throws {import('../core/errors/UsageError.js').UsageError} When `kind` is not `'pcs'` /
   *   `'npcs'` or an id is blank.
   */
  async summary(factionId, kind, characterId, options = {}) {
    return fetchSummary(this, factionId, kind, characterId, options);
  }

  /**
   * Uploads a photo in one call: `POST factions/<id>/photo_upload.json`, then
   * `POST uploads/image/<upload_id>/submit` (multipart, field `file`, header
   * `X-Upload-Token`). See `photoPath.js#uploadPhoto` for the options.
   * @param {string|number} factionId - The faction id.
   * @param {Blob|Uint8Array} file - A `Blob` / `File`, or a `Buffer` / `Uint8Array` (then
   *   `options.filename` is required).
   * @param {object} [options] - Upload options (`filename`, `contentType`, `timeout` of the
   *   submit step, default 120000, `headers`, `signal`).
   * @returns {Promise<unknown>} The submit body (`{ file_path }`).
   * @throws {import('../core/errors/UsageError.js').UsageError} On a restricted variant, a
   *   blank id or an invalid file, before any request.
   */
  async uploadPhoto(factionId, file, options = {}) {
    return uploadPhoto(this, factionId, file, options);
  }
}
