import BaseClient from './BaseClient.js';

/**
 * HTTP client for photo upload requests.
 */
export default class UploadClient extends BaseClient {
  /**
   * Initialises a photo upload for a game.
   *
   * @description Sends a POST request with the filename to reserve an upload slot,
   *   returning an id and upload token to be used in the submit step.
   * @param {string} gameSlug - The game slug.
   * @param {string} filename - The original file name of the photo to upload.
   * @param {string} token - Authentication token.
   * @returns {Promise<Response>} fetch response from the photo upload init endpoint.
   */
  initUpload(gameSlug, filename, token) {
    return this.request(`/games/${gameSlug}/photo_upload.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ filename }),
    });
  }

  /**
   * Submits the selected file to complete the upload.
   *
   * @description Sends a multipart POST request with the file data.
   *   The Content-Type header must NOT be set manually so the browser can
   *   compute the multipart boundary automatically. POST is required here
   *   even though this conceptually advances the upload's state, because
   *   PHP only auto-populates $_FILES for multipart bodies sent over POST.
   * @param {number|string} id - Upload ID returned by initUpload.
   * @param {string} uploadToken - Upload token returned by initUpload.
   * @param {File} file - File to upload.
   * @returns {Promise<Response>} fetch response from the upload submit endpoint.
   */
  submitUpload(id, uploadToken, file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request(`/uploads/${id}/submit`, {
      method: 'POST',
      headers: {
        'X-Upload-Token': uploadToken,
      },
      body: formData,
    });
  }
}
