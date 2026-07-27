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
   * @description Calls initUpload to obtain an upload id, token, and upload type, then calls
   *   submitUpload with the file and that upload type (used to build the type-scoped submit
   *   URL, e.g. `image` or `file` — issue #726). On success, invokes onSuccess. On any
   *   non-ok response or thrown error, sets the error flag.
   *
   *   When `photoUpload` is given (issue #878), a second init+submit cycle is chained after the
   *   first one succeeds: the first init response's own `id` (the newly created file's id) is
   *   used to build the second cycle's path via `photoUpload.buildPath`, and `photoUpload.file`
   *   is uploaded through it. `onSuccess` is only invoked once both cycles (or just the first,
   *   when `photoUpload` is omitted) complete. A failure in the second cycle sets a distinct
   *   `'photo'` error state so the UI can surface a dedicated message.
   * @param {string} uploadPath - Full path to the photo upload init endpoint.
   * @param {File} file - File to upload.
   * @param {string} token - Authentication token.
   * @param {string} [name] - Optional user-provided name for the uploaded file (issue #874),
   *   forwarded to `initUpload`.
   * @param {{file: File, buildPath: Function}} [photoUpload] - Optional second upload to chain
   *   after the first succeeds (issue #878): `file` is the photo to upload, `buildPath` is a
   *   function taking the first cycle's newly created file id and returning the photo-upload
   *   init path.
   * @returns {Promise<void>} Resolves when the upload handling finishes.
   */
  async handleSubmit(uploadPath, file, token, name, photoUpload) {
    try {
      const initResponse = await this.client.initUpload(uploadPath, file.name, token, name);

      if (!initResponse.ok) {
        this.setError(true);
        this.setUploading(false);
        return;
      }

      const { upload_id: uploadId, token: uploadToken, upload_type: uploadType, id: fileId } =
        await initResponse.json();
      const submitResponse = await this.client.submitUpload(uploadId, uploadToken, file, uploadType);

      if (!submitResponse.ok) {
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
   * Runs the second (photo) upload init+submit cycle, chained after a successful file upload
   * (issue #878).
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
      const initResponse = await this.client.initUpload(photoPath, photoFile.name, token);

      if (!initResponse.ok) {
        this.setError('photo');
        this.setUploading(false);
        return false;
      }

      const { upload_id: uploadId, token: uploadToken, upload_type: uploadType } = await initResponse.json();
      const submitResponse = await this.client.submitUpload(uploadId, uploadToken, photoFile, uploadType);

      if (!submitResponse.ok) {
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
