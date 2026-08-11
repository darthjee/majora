import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import PhotoUploadSaga from '../../../../common/base/controllers/PhotoUploadSaga.js';
import UploadClient from '../../../../../client/UploadClient.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the "New STL model" modal (`StlModelNewModal.jsx`).
 *
 * @description Mirrors `GameNpcNewController`'s deferred-photo-upload flow: the STL model is
 *   created first (name + tags, no photo), then — if a photo was picked — a second saga step
 *   uploads it against the newly created id, mirroring `GameNpcNewController#retryPhotoUpload`/
 *   `#failPhotoUpload`. Unlike the former standalone `/stl_models/new` page, there is no page-mount
 *   redirect gate here — the modal is only reachable through a button `StlModelsHelper` already
 *   renders exclusively for staff/superuser viewers — and every terminal success calls the
 *   caller-supplied `onSuccess` (via `setters.onSuccess`) instead of navigating to the new
 *   record's show page, so the modal/page decides what "success" means.
 */
export default class StlModelNewController extends BasePageController {
  /**
   * Create a STL model new controller.
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
   * Submit the new STL model form.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request through {@link RequestStore.mutate} (so the STL model collection's cached
   *   `GET` data is purged on success), then on success calls `setters.onSuccess` immediately when
   *   no photo was picked, or runs the photo upload saga step first when `formValues.photoFile` is
   *   set. On a 400 response, sets field errors. On any other failure, sets the general error
   *   status. `AccessStore.ensureStaffOrSuperUser()` is re-checked here as a defensive guard (the
   *   modal is only reachable through a button already gated on this same check) — on failure, the
   *   general error status is set instead of navigating away.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {{name: string, tags: string[], sources: {id: number, name: string}[],
   *   collections: {id: number, name: string}[], photoFile: File|null}} formValues - Raw form
   *   field values. `sources`/`collections` resolve to `source_ids`/`collection_ids` on submit.
   * @param {{setStatus: Function, setFieldErrors: Function, setCreatedId: Function,
   *   onSuccess: Function}} setters - Page state setters; `onSuccess` is called (with the created
   *   STL model id) once creation, and its photo upload if any, has fully succeeded.
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
   * Retry the photo upload saga step for an already-created STL model.
   *
   * @description Re-invokes the same upload-only path `submitForm` runs after STL model
   *   creation, without creating a new STL model. Used by the "retry" action of the
   *   photo-upload-failed UI state.
   * @param {number|string} stlModelId - Already-created STL model id.
   * @param {File} photoFile - Photo file to upload.
   * @param {{setStatus: Function, setCreatedId: Function, onSuccess: Function}} setters - Page
   *   state setters.
   * @returns {Promise<void>} Resolves when the retry handling finishes.
   */
  retryPhotoUpload(stlModelId, photoFile, setters) {
    return this.#uploadPhoto(stlModelId, photoFile, setters);
  }

  async #performCreate(formValues, setters) {
    const response = await RequestStore.mutate({
      componentName: 'StlModelNewController',
      resource: 'stlModel',
      method: 'POST',
      quantityType: 'collection',
      params: {},
      body: {
        name: formValues.name,
        tags: formValues.tags ?? [],
        source_ids: (formValues.sources ?? []).map((source) => source.id),
        collection_ids: (formValues.collections ?? []).map((collection) => collection.id),
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

  async #uploadPhoto(stlModelId, photoFile, setters) {
    const token = AuthStorage.getToken();
    const uploadPath = await RequestStore.resolvePath({
      resource: 'stlModel', method: 'POST', quantityType: 'single', params: { id: stlModelId },
    });
    const ok = await this.photoUploadSaga.upload(uploadPath, photoFile, token);

    if (ok) {
      // Purge before calling onSuccess, so the reloaded list's own `RequestStore.ensure` GET
      // doesn't re-serve the pre-upload cached STL model.
      RequestStore.purge({ resource: 'stlModel' });
      setters.onSuccess(stlModelId);
      return;
    }

    this.#failPhotoUpload(stlModelId, setters);
  }

  #failPhotoUpload(stlModelId, setters) {
    setters.setCreatedId(stlModelId);
    setters.setStatus('photo-upload-failed');
  }
}
