import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import PhotoUploadSaga from '../../../../common/base/controllers/PhotoUploadSaga.js';
import UploadClient from '../../../../../client/UploadClient.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the "New STL model" page (`StlModelNew.jsx`).
 *
 * @description Mirrors `GameNpcNewController`'s deferred-photo-upload flow: the STL model is
 *   created first (name/owned/type/race/role/tags/sources/collections, no photo), then — if a
 *   photo was picked — a second saga step uploads it against the newly created id, mirroring
 *   `GameNpcNewController#retryPhotoUpload`/`#failPhotoUpload`. Issue #1069 turned this back into
 *   a full page (from the `StlModelNewModal.jsx` it used to back): every terminal success now
 *   redirects to the new record's show page (`#/miniatures/stl_models/:id`) instead of calling a
 *   caller-supplied `onSuccess`, since there is no longer any caller-owned modal state to close.
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
   * Build the page mount effect.
   *
   * @description Returns a callback that checks whether the current user is staff or a
   *   superuser and redirects to the STL models index when they are not, since this page (unlike
   *   the modal it replaces) is directly reachable by URL.
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      AccessStore.ensureStaffOrSuperUser().then((isStaffOrSuperUser) => {
        if (!isStaffOrSuperUser) {
          this.redirectTo('/miniatures/stl_models');
        }
      });
    };
  }

  /**
   * Submit the new STL model form.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request through {@link RequestStore.mutate} (so the STL model collection's cached
   *   `GET` data is purged on success), then redirects to the new record's show page immediately
   *   when no photo was picked, or runs the photo upload saga step first when
   *   `formValues.photoFile` is set. On a 400 response, sets field errors. On any other failure,
   *   sets the general error status. `AccessStore.ensureStaffOrSuperUser()` is re-checked here as
   *   a defensive guard (the page's own mount effect already redirects unauthorized viewers
   *   away) — on failure, the general error status is set instead of navigating away.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {{name: string, owned: boolean, type: string, url: string, size: string,
   *   races: {id: string, name: string}[], roles: {id: string, name: string}[], tags: string[],
   *   sources: {id: number, name: string}[], collections: {id: number, name: string}[],
   *   photoFile: File|null}} formValues - Raw form field values. `sources`/`collections` resolve
   *   to `source_ids`/`collection_ids` on submit; `races`/`roles` resolve to a plain
   *   `db_value[]` (extracting each pick's `id`) on submit; `url`/`size` are converted from `''`
   *   to `null` on submit.
   * @param {{setStatus: Function, setFieldErrors: Function,
   *   setCreatedId: Function}} setters - Page state setters.
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
   * @param {{setStatus: Function, setCreatedId: Function}} setters - Page state setters.
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
        owned: formValues.owned,
        type: formValues.type,
        url: formValues.url || null,
        size: formValues.size || null,
        races: (formValues.races ?? []).map((race) => race.id),
        roles: (formValues.roles ?? []).map((role) => role.id),
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

      this.redirectTo(`/miniatures/stl_models/${data.id}`);
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
      // Purge before redirecting, so the show page's own `RequestStore.ensure` GET (triggered by
      // the redirect) doesn't re-serve the pre-upload cached STL model.
      RequestStore.purge({ resource: 'stlModel' });
      this.redirectTo(`/miniatures/stl_models/${stlModelId}`);
      return;
    }

    this.#failPhotoUpload(stlModelId, setters);
  }

  #failPhotoUpload(stlModelId, setters) {
    setters.setCreatedId(stlModelId);
    setters.setStatus('photo-upload-failed');
  }
}
