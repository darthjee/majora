import UploadClient from '../../../client/UploadClient.js';

/**
 * Manages photo upload modal state and upload requests.
 */
export default class PhotoUploadModalController {
  /**
   * Creates a new PhotoUploadModalController instance.
   *
   * @param {Function} setError - State setter for the error flag.
   * @param {Function} setUploading - State setter for the uploading flag.
   * @param {Function} onSuccess - Callback invoked after a successful upload.
   * @param {UploadClient} [client] - HTTP client used for upload requests.
   */
  constructor(setError, setUploading, onSuccess, client = new UploadClient()) {
    this.setError = setError;
    this.setUploading = setUploading;
    this.onSuccess = onSuccess;
    this.client = client;
  }

  /**
   * Initiates and submits a photo upload.
   *
   * @description Calls initUpload to obtain an upload id and token, then calls
   *   submitUpload with the file. On success, invokes onSuccess. On any
   *   non-ok response or thrown error, sets the error flag.
   * @param {string} gameSlug - The game slug.
   * @param {File} file - File to upload.
   * @param {string} token - Authentication token.
   * @returns {Promise<void>} Resolves when the upload handling finishes.
   */
  async handleSubmit(gameSlug, file, token) {
    try {
      const initResponse = await this.client.initUpload(gameSlug, file.name, token);

      if (!initResponse.ok) {
        this.setError(true);
        return;
      }

      const { id, token: uploadToken } = await initResponse.json();
      const submitResponse = await this.client.submitUpload(id, uploadToken, file);

      if (!submitResponse.ok) {
        this.setError(true);
        return;
      }

      this.onSuccess();
    } catch {
      this.setError(true);
    }
  }

  /**
   * Clears the modal error and uploading state.
   *
   * @returns {void}
   */
  handleClear() {
    this.setError(false);
    this.setUploading(false);
  }
}
