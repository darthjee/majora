import UploadClient from '../../../../../client/UploadClient.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';

const COMPONENT_NAME = 'StaffCopiesController';
const RESOURCE = 'staffCopy';
const FAILED = { ok: false, status: undefined };

/**
 * Outcome-returning single-request actions of the staff copy page (issue #1571).
 *
 * @description Every action resolves (never rejects) to an outcome `{ok, status}`, plus the
 *   parsed body as `data` for the copy request; a network error resolves to
 *   `{ok: false, status: undefined}`.
 */
export default class StaffCopyActions {
  /**
   * Create the staff copy actions.
   *
   * @param {object} [deps] - Injectable dependencies.
   * @param {UploadClient} [deps.uploadClient] - Client running the proxy link request.
   */
  constructor({ uploadClient = new UploadClient() } = {}) {
    this.uploadClient = uploadClient;
  }

  /**
   * Copy one source row into the target game.
   *
   * @param {string} copyType - Copy type slug.
   * @param {number} id - Source row id.
   * @param {string} target - Target game slug.
   * @returns {Promise<{ok: boolean, status: (number|undefined), data: (object|null)}>} The
   *   outcome; on `201`, `data` is `{id, links: [{upload_id, upload_type, token}]}`.
   */
  async copy(copyType, id, target) {
    try {
      const response = await RequestStore.mutate({
        componentName: COMPONENT_NAME,
        resource: RESOURCE,
        method: 'POST',
        quantityType: 'copy',
        params: { copyType, id },
        body: { target },
        variantName: 'regular',
      });
      const data = response.ok ? await response.json() : null;

      return { ok: response.ok, status: response.status, data };
    } catch {
      return { ...FAILED, data: null };
    }
  }

  /**
   * Link one copied file to its source through the upload proxy.
   *
   * @param {{upload_id: number, upload_type: string, token: string}} link - The pending link.
   * @returns {Promise<{ok: boolean, status: (number|undefined)}>} The outcome.
   */
  async link({ upload_id: uploadId, upload_type: uploadType, token }) {
    try {
      const response = await this.uploadClient.linkUpload(uploadType, uploadId, token);

      return { ok: response.ok, status: response.status };
    } catch {
      return { ...FAILED };
    }
  }
}
