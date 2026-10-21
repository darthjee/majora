import { UsageError } from '../core/errors/UsageError.js';
import { encodeSegment } from './Resource.js';

/**
 * Default timeout of the upload submit step, in milliseconds (120 s).
 * @type {number}
 */
export const UPLOAD_SUBMIT_TIMEOUT = 120000;

/**
 * Variant map entry of the upload init (`POST <id>/photo_upload`); no restricted variant.
 * @type {{regular: string, restricted: null}}
 */
export const PHOTO_UPLOAD_VARIANT = { regular: ':id/photo_upload', restricted: null };

/**
 * Variant map entry of set-as-main (`PATCH <id>/photos/<photo_id>/set`). `pathFor` only
 * resolves `:id`, so the photo id and the `/set` suffix are appended by `photoPath`.
 * @type {{regular: string, restricted: null}}
 */
export const PHOTO_SET_VARIANT = { regular: ':id/photos', restricted: null };

/**
 * Variant map entry of photo deletion (`DELETE <id>/photos/<photo_id>`). `pathFor` only
 * resolves `:id`, so the photo id is appended by `photoPath`.
 * @type {{regular: string, restricted: null}}
 */
export const PHOTO_DELETE_VARIANT = { regular: ':id/photos', restricted: null };

/**
 * Builds the path of a photo action on one photo
 * (`<id>/photos/<photo_id>` for `photoDelete`, `<id>/photos/<photo_id>/set` for `photoSet`).
 * @param {import('./Resource.js').Resource} resource - The family wrapper.
 * @param {string} action - `'photoSet'` or `'photoDelete'`.
 * @param {string|number} id - The record id.
 * @param {string|number} photoId - The photo id.
 * @param {boolean} [restricted] - Select the restricted variant (always missing).
 * @returns {string} The path, relative to `baseUrl` and without `.json`.
 * @throws {UsageError} When the family lacks the action, a restricted variant is asked
 *   for, or an id is blank.
 */
export function photoPath(resource, action, id, photoId, restricted = false) {
  const base = resource.pathFor(action, { restricted, id });
  const photo = encodeSegment(photoId, 'photo id');

  return action === 'photoSet' ? `${base}/${photo}/set` : `${base}/${photo}`;
}

/**
 * Turns the `file` argument of `uploadPhoto` into a `Blob` and its file name.
 * @param {Blob|Uint8Array} file - A `Blob` / `File`, or a `Buffer` / `Uint8Array`.
 * @param {object} options - Upload options.
 * @param {string} [options.filename] - File name; required for a `Buffer` / `Uint8Array`.
 * @param {string} [options.contentType] - MIME type for a `Buffer` / `Uint8Array`.
 * @returns {{blob: Blob, filename: (string|undefined)}} The blob and its name.
 * @throws {UsageError} When `file` has an unsupported type or the file name is missing.
 */
export function toUploadBlob(file, { filename, contentType } = {}) {
  if (file instanceof Blob) {
    return { blob: file, filename: filename || file.name || undefined };
  }
  if (file instanceof Uint8Array) {
    if (!filename) {
      throw new UsageError('Missing filename: required when uploading a Buffer or Uint8Array');
    }

    return { blob: new Blob([file], contentType ? { type: contentType } : {}), filename };
  }

  throw new UsageError('Invalid file: expected a Blob, File, Buffer or Uint8Array');
}

/**
 * Uploads a photo in two steps: `POST <id>/photo_upload.json` (→ `{ upload_id, token }`),
 * then `POST uploads/image/<upload_id>/submit` (no `.json`) with the file as
 * `multipart/form-data` (field `file`) and the upload token in `X-Upload-Token`.
 *
 * The init step uses the configured timeout; the submit step uses `options.timeout`, else
 * `UPLOAD_SUBMIT_TIMEOUT`. Neither step is retried. Everything is validated before the
 * first request.
 * @param {import('./Resource.js').Resource} resource - The family wrapper.
 * @param {string|number} id - The record id.
 * @param {Blob|Uint8Array} file - A `Blob` / `File`, or a `Buffer` / `Uint8Array`.
 * @param {object} [options] - Upload options.
 * @param {string} [options.filename] - File name (required for a `Buffer` / `Uint8Array`).
 * @param {string} [options.contentType] - MIME type for a `Buffer` / `Uint8Array`.
 * @param {number} [options.timeout] - Submit timeout in ms (default 120000, `0` disables).
 * @param {object} [options.headers] - Extra request headers (both steps).
 * @param {AbortSignal} [options.signal] - Caller abort signal (both steps).
 * @param {boolean} [options.restricted] - Always throws: there is no restricted variant.
 * @returns {Promise<unknown>} The submit body (`{ file_path }`).
 * @throws {UsageError} On a missing action / variant, a blank id or an invalid file.
 */
export async function uploadPhoto(resource, id, file, options = {}) {
  const {
    restricted, filename, contentType, timeout, headers, signal,
  } = options;
  const initPath = resource.pathFor('photoUpload', { restricted, id });
  const upload = toUploadBlob(file, { filename, contentType });

  const { body: init } = await resource.http.post(initPath, undefined, { headers, signal });
  const submitPath = `uploads/image/${encodeSegment(init?.upload_id, 'upload id')}/submit`;
  const form = new FormData();

  if (upload.filename) {
    form.append('file', upload.blob, upload.filename);
  } else {
    form.append('file', upload.blob);
  }

  const { body } = await resource.http.post(submitPath, form, {
    json: false,
    headers: { ...headers, 'X-Upload-Token': init.token },
    timeout: timeout ?? UPLOAD_SUBMIT_TIMEOUT,
    signal,
  });

  return body;
}

/**
 * Sets a photo as the main one (`PATCH <id>/photos/<photo_id>/set.json`, no body).
 * @param {import('./Resource.js').Resource} resource - The family wrapper.
 * @param {string|number} id - The record id.
 * @param {string|number} photoId - The photo id.
 * @param {object} [options] - Request options (see `Resource#get`).
 * @returns {Promise<unknown>} The parsed body.
 * @throws {UsageError} See `photoPath`.
 */
export async function setMainPhoto(resource, id, photoId, options = {}) {
  const { restricted, ...rest } = options;
  const path = photoPath(resource, 'photoSet', id, photoId, restricted);
  const { body } = await resource.http.patch(path, undefined, rest);

  return body;
}

/**
 * Deletes a photo (`DELETE <id>/photos/<photo_id>.json`).
 * @param {import('./Resource.js').Resource} resource - The family wrapper.
 * @param {string|number} id - The record id.
 * @param {string|number} photoId - The photo id.
 * @param {object} [options] - Request options (see `Resource#get`).
 * @returns {Promise<unknown>} The parsed body.
 * @throws {UsageError} See `photoPath`.
 */
export async function deletePhoto(resource, id, photoId, options = {}) {
  const { restricted, ...rest } = options;
  const path = photoPath(resource, 'photoDelete', id, photoId, restricted);
  const { body } = await resource.http.delete(path, rest);

  return body;
}
