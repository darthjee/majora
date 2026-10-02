import UploadClient from '../../../../../client/UploadClient.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import StaffPhotoResizer from '../helpers/StaffPhotoResizer.js';
import staffPhotoErrorKey from '../helpers/StaffPhotoErrors.js';

const PREFIX = 'staff_photos_page';
const COMPONENT_NAME = 'StaffPhotosController';
const RESOURCE = 'staffPhoto';

/**
 * Builds a failed outcome.
 *
 * @param {string} reason - Full i18n key of the failure reason.
 * @param {number|undefined} code - HTTP status of the failed response, when there is one.
 * @returns {{status: string, reason: string, code: (number|undefined)}} The failed outcome.
 */
function failed(reason, code) {
  return { status: 'failed', reason, code };
}

/**
 * Outcome-returning single-photo actions of the staff photos page (issue #1474).
 *
 * @description Shared by the single-click path and the bulk runner of
 *   `StaffPhotosController`. Every action resolves (never rejects) to an outcome
 *   `{status, reason, code}`: `status` is `'done'`, `'skipped'` or `'failed'`, `reason` is the
 *   full `staff_photos_page.*` i18n key (absent when done) and `code` is the HTTP status of a
 *   failed response (used to purge and refetch on 404).
 */
export default class StaffPhotoActions {
  /**
   * Create the staff photo actions.
   *
   * @param {object} [deps] - Injectable dependencies.
   * @param {UploadClient} [deps.uploadClient] - Client running the replace upload cycle.
   * @param {Function} [deps.resizer] - Resizer exposing `resize(photo, max, options)`.
   */
  constructor({ uploadClient = new UploadClient(), resizer = StaffPhotoResizer } = {}) {
    this.uploadClient = uploadClient;
    this.resizer = resizer;
  }

  /**
   * Build the staff replace (upload init) path of a photo.
   *
   * @param {string} photoType - Photo type slug.
   * @param {{id: number}} photo - The photo row.
   * @returns {string} The replace endpoint path.
   */
  static replacePath(photoType, photo) {
    return `/staff/photos/${photoType}/${photo.id}/replace.json`;
  }

  /**
   * Delete a photo through {@link RequestStore.mutate}.
   *
   * @param {string} photoType - Photo type slug.
   * @param {{id: number}} photo - The photo row.
   * @returns {Promise<object>} `done`, or `failed` with the delete error key (network errors
   *   map to the generic error).
   */
  async deletePhoto(photoType, photo) {
    try {
      const response = await RequestStore.mutate({
        componentName: COMPONENT_NAME,
        resource: RESOURCE,
        method: 'DELETE',
        quantityType: 'single',
        params: { photoType, id: photo.id },
        variantName: 'regular',
      });

      if (response.ok) return { status: 'done' };

      return failed(staffPhotoErrorKey('delete', response.status), response.status);
    } catch {
      return failed(staffPhotoErrorKey('delete'));
    }
  }

  /**
   * Resize a photo in the browser and upload the result through the staff Replace flow.
   *
   * @param {string} photoType - Photo type slug.
   * @param {{id: number, path: string}} photo - The photo row.
   * @param {number} maxDimension - Max dimension of the longest side.
   * @param {object} [versions] - Map of photo id to cache-busting version.
   * @returns {Promise<object>} `done` once uploaded, `skipped` / `failed` from the resizer, or
   *   `failed` with the replace error key when the upload is rejected.
   */
  async resizePhoto(photoType, photo, maxDimension, versions = {}) {
    try {
      const result = await this.resizer.resize(photo, maxDimension, { versions });

      if (result.status !== 'resized') return { status: result.status, reason: `${PREFIX}.${result.reason}` };

      const path = StaffPhotoActions.replacePath(photoType, photo);
      const { ok, status } = await this.uploadClient.runUploadCycle(path, result.file, AuthStorage.getToken());

      if (ok) return { status: 'done' };

      return failed(staffPhotoErrorKey('replace', status), status);
    } catch {
      return failed(staffPhotoErrorKey('replace'));
    }
  }
}
