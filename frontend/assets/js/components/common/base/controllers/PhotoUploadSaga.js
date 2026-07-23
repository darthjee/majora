import UploadClient from '../../../../client/UploadClient.js';

/**
 * Shared create-then-upload saga step: the two-step upload flow
 * (`UploadClient#initUpload` then `#submitUpload`), used via composition by any controller that
 * needs to upload a photo against an already-created entity (e.g. `GameNpcNewController`,
 * `CharacterItemNewController`).
 */
export default class PhotoUploadSaga {
  /**
   * Create a photo upload saga.
   *
   * @param {UploadClient|null} [uploadClient] - Upload client override.
   */
  constructor(uploadClient = null) {
    this.uploadClient = uploadClient ?? new UploadClient();
  }

  /**
   * Run the two-step upload flow against an already-created entity.
   *
   * @param {string} uploadPath - Full path to the photo upload init endpoint.
   * @param {File} photoFile - Photo file to upload.
   * @param {string|null} token - Authentication token, if any.
   * @returns {Promise<boolean>} Resolves to whether the upload succeeded.
   */
  async upload(uploadPath, photoFile, token) {
    try {
      const initResponse = await this.uploadClient.initUpload(uploadPath, photoFile.name, token);

      if (!initResponse.ok) return false;

      const { upload_id: uploadId, token: uploadToken } = await initResponse.json();
      const submitResponse = await this.uploadClient.submitUpload(uploadId, uploadToken, photoFile);

      return submitResponse.ok;
    } catch {
      return false;
    }
  }
}
