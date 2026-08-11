import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import PhotoUploadSaga from '../../../../common/base/controllers/PhotoUploadSaga.js';
import UploadClient from '../../../../../client/UploadClient.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the "New Collection" modal (`CollectionNewModal.jsx`).
 *
 * @description Mirrors `SourceNewController`'s deferred-photo-upload flow: the collection is
 *   created first (name + url, no photo, no source — `source` starts `null` and is assigned
 *   later, a separate not-yet-built feature), then — if a photo was picked — a second saga step
 *   uploads it against the newly created id, mirroring `SourceNewController#retryPhotoUpload`/
 *   `#failPhotoUpload`. There is no page-mount redirect gate here — the modal is only reachable
 *   through a button `CollectionsHelper` already renders exclusively for staff/superuser viewers
 *   — and every terminal success calls the caller-supplied `onSuccess` (via `setters.onSuccess`)
 *   instead of navigating to the new record's show page, so the modal/page decides what
 *   "success" means.
 */
export default class CollectionNewController extends BasePageController {
  /**
   * Create a collection new controller.
   *
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   * @param {UploadClient|null} [uploadClient] - Upload client override.
   */
  constructor(setError, setFieldErrors = Noop.noop, uploadClient = null) {
    super();
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
    this.uploadClient = uploadClient ?? new UploadClient();
    this.photoUploadSaga = new PhotoUploadSaga(this.uploadClient);
  }

  /**
   * Submit the new collection form.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request through {@link RequestStore.mutate} (so the collection collection's cached
   *   `GET` data is purged on success), then on success calls `setters.onSuccess` immediately
   *   when no photo was picked, or runs the photo upload saga step first when
   *   `formValues.photoFile` is set. On a 400 response, sets field errors. On any other failure,
   *   sets the general error status. `AccessStore.ensureStaffOrSuperUser()` is re-checked here as
   *   a defensive guard (the modal is only reachable through a button already gated on this same
   *   check) — on failure, the general error status is set instead of navigating away.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {{name: string, url: string, photoFile: File|null}} formValues - Raw form field
   *   values.
   * @param {{setStatus: Function, setFieldErrors: Function, setCreatedId: Function,
   *   onSuccess: Function}} setters - Page state setters; `onSuccess` is called (with the created
   *   collection id) once creation, and its photo upload if any, has fully succeeded.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const isStaffOrSuperUser = await AccessStore.ensureStaffOrSuperUser();

    if (!isStaffOrSuperUser) {
      setters.setStatus('error');
      return;
    }

    try {
      await this.#performCreate(formValues, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  /**
   * Retry the photo upload saga step for an already-created collection.
   *
   * @description Re-invokes the same upload-only path `submitForm` runs after collection
   *   creation, without creating a new collection. Used by the "retry" action of the
   *   photo-upload-failed UI state.
   * @param {number|string} collectionId - Already-created collection id.
   * @param {File} photoFile - Photo file to upload.
   * @param {{setStatus: Function, setCreatedId: Function, onSuccess: Function}} setters - Page
   *   state setters.
   * @returns {Promise<void>} Resolves when the retry handling finishes.
   */
  retryPhotoUpload(collectionId, photoFile, setters) {
    return this.#uploadPhoto(collectionId, photoFile, setters);
  }

  async #performCreate(formValues, setters) {
    const response = await RequestStore.mutate({
      componentName: 'CollectionNewController',
      resource: 'collection',
      method: 'POST',
      quantityType: 'collection',
      params: {},
      body: {
        name: formValues.name,
        url: formValues.url ?? '',
      },
    });

    await this.#handleResponse(response, formValues.photoFile, setters);
  }

  async #handleResponse(response, photoFile, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (photoFile) {
        await this.#uploadPhoto(data.id, photoFile, setters);
        return;
      }

      setters.onSuccess(data.id);
      return;
    }

    const data = await response.json();
    const errors = data.errors ?? {};

    if (response.status === 400) {
      setters.setFieldErrors(errors);
      return;
    }

    setters.setStatus('error');
  }

  async #uploadPhoto(collectionId, photoFile, setters) {
    const token = AuthStorage.getToken();
    const uploadPath = await RequestStore.resolvePath({
      resource: 'collection', method: 'POST', quantityType: 'single', params: { id: collectionId },
    });
    const ok = await this.photoUploadSaga.upload(uploadPath, photoFile, token);

    if (ok) {
      // Purge before calling onSuccess, so the reloaded list's own `RequestStore.ensure` GET
      // doesn't re-serve the pre-upload cached collection.
      RequestStore.purge({ resource: 'collection' });
      setters.onSuccess(collectionId);
      return;
    }

    this.#failPhotoUpload(collectionId, setters);
  }

  #failPhotoUpload(collectionId, setters) {
    setters.setCreatedId(collectionId);
    setters.setStatus('photo-upload-failed');
  }
}
