import { CharacterDocuments } from './CharacterDocuments.js';
import { CharacterFactions } from './CharacterFactions.js';
import { CharacterItems } from './CharacterItems.js';
import { GameResource } from './GameResource.js';
import {
  PHOTO_DELETE_VARIANT, PHOTO_SET_VARIANT, PHOTO_UPLOAD_VARIANT, deletePhoto, setMainPhoto, uploadPhoto,
} from './photoPath.js';

/**
 * Shared base for the character families (`npcs` and `pcs`), whose routes are parallel
 * (built by `backend/games/urls/_character_routes.py`).
 *
 * It declares the variants both families share — `get` (`<id>` / `<id>/full`) and `update`
 * (`PATCH <id>` / `PATCH <id>/full`) — that `Npcs` and `Pcs` extend with their own `list`
 * and `create` entries, and the bound link sub-wrappers `items(id)`, `documents(id)` and
 * `factions(id)`. Photos: `uploadPhoto(id, file)`, `setMainPhoto(id, photoId)` and
 * `deletePhoto(id, photoId)`, with no restricted variant.
 *
 * @example
 * const npcs = client.game('epic-quest').npcs;
 * await npcs.items(12).available();                    // npcs/12/items/available.json
 * await npcs.documents(12).acquire({ document_id: 7 }); // POST npcs/12/documents/acquire.json
 * await npcs.factions(12).remove(5);                   // POST npcs/12/factions/5/remove.json
 * await npcs.uploadPhoto(12, blob);                    // POST npcs/12/photo_upload.json + submit
 * await npcs.setMainPhoto(12, 3);                      // PATCH npcs/12/photos/3/set.json
 * await npcs.deletePhoto(12, 3);                       // DELETE npcs/12/photos/3.json
 */
export class CharacterResource extends GameResource {
  /**
   * Variants shared by every character family.
   * @type {Object<string, {regular: (string|null), restricted: (string|null)}>}
   */
  static variants = {
    get: { regular: ':id', restricted: ':id/full' },
    update: { regular: ':id', restricted: ':id/full' },
    photoUpload: PHOTO_UPLOAD_VARIANT,
    photoSet: PHOTO_SET_VARIANT,
    photoDelete: PHOTO_DELETE_VARIANT,
  };

  /**
   * Builds the wrapper for the items of one character.
   * @param {string|number} characterId - The character id.
   * @returns {CharacterItems} The items wrapper, bound to that character.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the id is blank.
   */
  items(characterId) {
    return new CharacterItems(this.http, this.paginator, this.basePath, characterId);
  }

  /**
   * Builds the wrapper for the documents of one character.
   * @param {string|number} characterId - The character id.
   * @returns {CharacterDocuments} The documents wrapper, bound to that character.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the id is blank.
   */
  documents(characterId) {
    return new CharacterDocuments(this.http, this.paginator, this.basePath, characterId);
  }

  /**
   * Builds the wrapper for the factions of one character.
   * @param {string|number} characterId - The character id.
   * @returns {CharacterFactions} The factions wrapper, bound to that character.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the id is blank.
   */
  factions(characterId) {
    return new CharacterFactions(this.http, this.paginator, this.basePath, characterId);
  }

  /**
   * Uploads a photo in one call: `POST <family>/<id>/photo_upload.json`, then
   * `POST uploads/image/<upload_id>/submit` (multipart, field `file`, header
   * `X-Upload-Token`). See `photoPath.js#uploadPhoto` for the options.
   * @param {string|number} characterId - The character id.
   * @param {Blob|Uint8Array} file - A `Blob` / `File`, or a `Buffer` / `Uint8Array` (then
   *   `options.filename` is required).
   * @param {object} [options] - Upload options (`filename`, `contentType`, `timeout` of the
   *   submit step, default 120000, `headers`, `signal`).
   * @returns {Promise<unknown>} The submit body (`{ file_path }`).
   * @throws {import('../core/errors/UsageError.js').UsageError} On a restricted variant, a
   *   blank id or an invalid file, before any request.
   */
  async uploadPhoto(characterId, file, options = {}) {
    return uploadPhoto(this, characterId, file, options);
  }

  /**
   * Sets a photo as the main one (`PATCH <family>/<id>/photos/<photo_id>/set.json`).
   * @param {string|number} characterId - The character id.
   * @param {string|number} photoId - The photo id.
   * @param {object} [options] - Request options (see `Resource#get`).
   * @returns {Promise<unknown>} The parsed body.
   * @throws {import('../core/errors/UsageError.js').UsageError} On a restricted variant or a
   *   blank id, before any request.
   */
  async setMainPhoto(characterId, photoId, options = {}) {
    return setMainPhoto(this, characterId, photoId, options);
  }

  /**
   * Deletes a photo (`DELETE <family>/<id>/photos/<photo_id>.json`).
   * @param {string|number} characterId - The character id.
   * @param {string|number} photoId - The photo id.
   * @param {object} [options] - Request options (see `Resource#get`).
   * @returns {Promise<unknown>} The parsed body.
   * @throws {import('../core/errors/UsageError.js').UsageError} On a restricted variant or a
   *   blank id, before any request.
   */
  async deletePhoto(characterId, photoId, options = {}) {
    return deletePhoto(this, characterId, photoId, options);
  }
}
