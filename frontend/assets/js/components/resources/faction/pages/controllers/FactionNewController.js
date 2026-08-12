import AuthStorage from '../../../../../utils/auth/AuthStorage.js';
import AccessStore from '../../../../../utils/access/store/AccessStore.js';
import RequestStore from '../../../../../utils/requests/RequestStore.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import PhotoUploadSaga from '../../../../common/base/controllers/PhotoUploadSaga.js';
import UploadClient from '../../../../../client/UploadClient.js';
import Noop from '../../../../../utils/Noop.js';

/**
 * Controller for the "New Faction" modal (`FactionNewModal.jsx`, issue #812).
 *
 * @description Mirrors `SourceNewController`'s deferred-photo-upload flow exactly (the faction
 *   is created first with just a `name`, then — if a photo was picked — a second saga step
 *   uploads it against the newly created id), but the defensive re-check gates on the game's
 *   `regular` (staff+player) create permission (`can_create_faction`, via
 *   `AccessStore.ensureGamePermissions`) instead of `SourceNewController`'s staff-only
 *   `AccessStore.ensureStaffOrSuperUser()`, mirroring `GamePossessionNewController`'s own
 *   `can_create_possession` gate. There is no page-mount redirect gate here — the modal is only
 *   reachable through a button `GameFactionsHelper` already renders exclusively for viewers who
 *   pass this same check (`GameFactionsController`'s own `can_create_faction` resolution) — and
 *   every terminal success calls the caller-supplied `onSuccess` (via `setters.onSuccess`)
 *   instead of navigating to the new record's show page, so the modal/page decides what
 *   "success" means.
 */
export default class FactionNewController extends BasePageController {
  /**
   * Create a faction new controller.
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
   * Submit the new faction form.
   *
   * @description Prevents the default form submission, resets status and field errors, sends a
   *   POST request through {@link RequestStore.mutate} (so the faction collection's cached `GET`
   *   data is purged on success), then on success calls `setters.onSuccess` immediately when no
   *   photo was picked, or runs the photo upload saga step first when `formValues.photoFile` is
   *   set. On a 400 response, sets field errors. On any other failure, sets the general error
   *   status. `AccessStore.ensureGamePermissions(gameSlug)`'s `can_create_faction` is re-checked
   *   here as a defensive guard (the modal is only reachable through a button already gated on
   *   this same check) — on failure, the general error status is set instead of navigating away.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {string} gameSlug - Game slug.
   * @param {{name: string, photoFile: File|null}} formValues - Raw form field values.
   * @param {{setStatus: Function, setFieldErrors: Function, setCreatedId: Function,
   *   onSuccess: Function}} setters - Page state setters; `onSuccess` is called (with the created
   *   faction id) once creation, and its photo upload if any, has fully succeeded.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submitForm(event, gameSlug, formValues, setters) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    const canCreateFaction = await AccessStore.ensureGamePermissions(gameSlug)
      .then((permissions) => Boolean(permissions.can_create_faction))
      .catch(() => false);

    if (!canCreateFaction) {
      setters.setStatus('error');
      return;
    }

    try {
      await this.#performCreate(gameSlug, formValues, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  /**
   * Retry the photo upload saga step for an already-created faction.
   *
   * @description Re-invokes the same upload-only path `submitForm` runs after faction creation,
   *   without creating a new faction. Used by the "retry" action of the photo-upload-failed UI
   *   state.
   * @param {string} gameSlug - Game slug.
   * @param {number|string} factionId - Already-created faction id.
   * @param {File} photoFile - Photo file to upload.
   * @param {{setStatus: Function, setCreatedId: Function, onSuccess: Function}} setters - Page
   *   state setters.
   * @returns {Promise<void>} Resolves when the retry handling finishes.
   */
  retryPhotoUpload(gameSlug, factionId, photoFile, setters) {
    return this.#uploadPhoto(gameSlug, factionId, photoFile, setters);
  }

  async #performCreate(gameSlug, formValues, setters) {
    const response = await RequestStore.mutate({
      componentName: 'FactionNewController',
      resource: 'faction',
      method: 'POST',
      quantityType: 'collection',
      params: { gameSlug },
      body: { name: formValues.name },
    });

    await this.#handleResponse(response, gameSlug, formValues.photoFile, setters);
  }

  async #handleResponse(response, gameSlug, photoFile, setters) {
    if (response.status === 201) {
      const data = await response.json();

      if (photoFile) {
        await this.#uploadPhoto(gameSlug, data.id, photoFile, setters);
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

  async #uploadPhoto(gameSlug, factionId, photoFile, setters) {
    const token = AuthStorage.getToken();
    const uploadPath = await RequestStore.resolvePath({
      resource: 'faction', method: 'POST', quantityType: 'single', params: { gameSlug, id: factionId },
    });
    const ok = await this.photoUploadSaga.upload(uploadPath, photoFile, token);

    if (ok) {
      // Purge before calling onSuccess, so the reloaded list's own `RequestStore.ensure` GET
      // doesn't re-serve the pre-upload cached faction.
      RequestStore.purge({ resource: 'faction' });
      setters.onSuccess(factionId);
      return;
    }

    this.#failPhotoUpload(factionId, setters);
  }

  #failPhotoUpload(factionId, setters) {
    setters.setCreatedId(factionId);
    setters.setStatus('photo-upload-failed');
  }
}
