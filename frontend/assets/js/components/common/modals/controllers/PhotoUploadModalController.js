import UploadClient from '../../../../client/UploadClient.js';

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
   * @description Runs `UploadClient#runUploadCycle` to init and submit the file, threading the
   *   upload type returned by the init step (e.g. `image` or `file` — issue #726) through
   *   internally. On success, invokes onSuccess. On any non-ok response or thrown error, sets
   *   the error flag.
   *
   *   When `photoUpload` is given (issue #878), a second upload cycle is chained after the first
   *   one succeeds: the first cycle's own `id` (the newly created file's id) is used to build the
   *   second cycle's path via `photoUpload.buildPath`, and `photoUpload.file` is uploaded through
   *   it. `onSuccess` is only invoked once both cycles (or just the first, when `photoUpload` is
   *   omitted) complete. A failure in the second cycle sets a distinct `'photo'` error state so
   *   the UI can surface a dedicated message.
   * @param {string} uploadPath - Full path to the photo upload init endpoint.
   * @param {File} file - File to upload.
   * @param {string} token - Authentication token.
   * @param {string} [name] - Optional user-provided name for the uploaded file (issue #874),
   *   forwarded to `runUploadCycle`.
   * @param {{file: File, buildPath: Function}} [photoUpload] - Optional second upload to chain
   *   after the first succeeds (issue #878): `file` is the photo to upload, `buildPath` is a
   *   function taking the first cycle's newly created file id and returning the photo-upload
   *   init path.
   * @returns {Promise<void>} Resolves when the upload handling finishes.
   */
  async handleSubmit(uploadPath, file, token, name, photoUpload) {
    try {
      const { ok, id: fileId } = await this.client.runUploadCycle(uploadPath, file, token, name);

      if (!ok) {
        this.setError(true);
        this.setUploading(false);
        return;
      }

      if (photoUpload && !(await this.#submitPhotoUpload(photoUpload, fileId, token))) {
        return;
      }

      this.setUploading(false);
      this.onSuccess();
    } catch {
      this.setError(true);
      this.setUploading(false);
    }
  }

  /**
   * Runs the second (photo) upload cycle, chained after a successful file upload (issue #878).
   *
   * @param {{file: File, buildPath: Function}} photoUpload - The photo file to upload and a
   *   function building the photo-upload init path from the newly created file's id.
   * @param {number|string} fileId - The newly created file's own id, returned by the first
   *   upload cycle's init response.
   * @param {string} token - Authentication token.
   * @returns {Promise<boolean>} Whether the photo upload cycle succeeded.
   */
  async #submitPhotoUpload(photoUpload, fileId, token) {
    try {
      const { file: photoFile, buildPath } = photoUpload;
      const photoPath = buildPath(fileId);
      const { ok } = await this.client.runUploadCycle(photoPath, photoFile, token);

      if (!ok) {
        this.setError('photo');
        this.setUploading(false);
        return false;
      }

      return true;
    } catch {
      this.setError('photo');
      this.setUploading(false);
      return false;
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
