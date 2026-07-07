import BasePageController from './BasePageController.js';
import Noop from '../../../utils/Noop.js';

/**
 * Base controller for entity Edit pages (Game, Treasure, GameSession,
 * StaffUser, GameTreasure).
 *
 * @description Holds the skeleton shared by every Edit-page controller: the
 *   mount-guard/`safeSet` effect wrapper, parameterized fetch helpers
 *   ({@link BaseEditController#fetchWithAccess}, {@link BaseEditController#fetchSingle}),
 *   a `redirectTo` helper honoring the mount guard, and the submit-and-handle-response
 *   flow ({@link BaseEditController#performSubmit}: redirect on success, field errors
 *   on 400, generic error otherwise). Subclasses implement `loadResource(safeSet,
 *   isMounted)` for their specific fetch/gate logic (e.g. `TreasureEditController`'s
 *   superuser gate), and keep their own `submitForm()` with its original signature,
 *   delegating to `performSubmit()` to reuse the response handling.
 */
export default class BaseEditController extends BasePageController {
  /**
   * Create a base edit controller.
   *
   * @param {Function} setResource - Setter for the loaded resource (game, treasure, etc.).
   * @param {Function} setLoading - Loading setter.
   * @param {Function} setError - General error setter.
   * @param {Function} [setFieldErrors] - Per-field error setter.
   */
  constructor(setResource, setLoading, setError, setFieldErrors = Noop.noop) {
    super();
    this.setResource = setResource;
    this.setLoading = setLoading;
    this.setError = setError;
    this.setFieldErrors = setFieldErrors;
  }

  /**
   * Build the page loading effect: sets up the mount guard and delegates to
   * {@link BaseEditController#loadResource}, implemented by subclasses.
   *
   * @returns {Function} Effect callback.
   */
  buildEffect() {
    return () => {
      let mounted = true;
      const isMounted = () => mounted;
      const safeSet = this.buildSafeSetter(isMounted);

      this.loadResource(safeSet, isMounted);

      return () => {
        mounted = false;
      };
    };
  }

  /**
   * Load the resource for the edit page. Must be implemented by subclasses.
   *
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @param {Function} isMounted - Returns whether the page is still mounted.
   * @returns {void}
   */
  loadResource(safeSet, isMounted) { // eslint-disable-line no-unused-vars
    throw new Error('BaseEditController#loadResource must be implemented by subclass');
  }

  /**
   * Redirect the browser to the given hash, unless the page has been unmounted.
   *
   * @param {string} hash - Hash to navigate to (without the leading `#`).
   * @param {Function} [isMounted] - Returns whether the page is still mounted;
   *   defaults to always mounted, for controllers that redirect unconditionally.
   * @returns {void}
   */
  redirectTo(hash, isMounted = () => true) {
    if (!isMounted() || typeof window === 'undefined') {
      return;
    }

    window.location.hash = hash;
  }

  /**
   * Fetch the resource and its access permissions in parallel, merging access
   * onto the resource (tolerant of access failure, defaulting to `can_edit: false`),
   * and updating loading/error state.
   *
   * @param {Promise<Response>} resourcePromise - Resource fetch response promise.
   * @param {Promise<Response>} accessPromise - Access fetch response promise.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @param {string} errorMessage - Error message set when the resource fetch fails.
   * @returns {void}
   */
  fetchWithAccess(resourcePromise, accessPromise, safeSet, errorMessage) {
    Promise.all([resourcePromise, accessPromise])
      .then(([resourceResponse, accessResponse]) => Promise.all([
        resourceResponse.ok
          ? resourceResponse.json()
          : Promise.reject(new Error('resource failed')),
        accessResponse.ok
          ? accessResponse.json()
          : Promise.resolve({ can_edit: false }),
      ]))
      .then(([resource, access]) => safeSet(this.setResource, { ...resource, ...access }))
      .catch(() => safeSet(this.setError, errorMessage))
      .finally(() => safeSet(this.setLoading, false));
  }

  /**
   * Fetch the resource alone (no access merge), updating loading/error state.
   *
   * @param {Promise<Response>} resourcePromise - Resource fetch response promise.
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @param {*} errorValue - Error value set when the fetch fails (string message
   *   or a boolean flag, depending on the subclass's error state shape).
   * @returns {void}
   */
  fetchSingle(resourcePromise, safeSet, errorValue) {
    resourcePromise
      .then((response) => (response.ok
        ? response.json()
        : Promise.reject(new Error('resource failed'))))
      .then((resource) => safeSet(this.setResource, resource))
      .catch(() => safeSet(this.setError, errorValue))
      .finally(() => safeSet(this.setLoading, false));
  }

  /**
   * Shared submit flow: prevents the default form submission, resets status
   * and field errors, invokes the given update call, then handles the
   * response (redirect on success, field errors on 400, error status otherwise).
   *
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {{setStatus: Function, setFieldErrors: Function}} setters - Page state setters.
   * @param {Function} updateCall - Zero-arg function returning the update request promise.
   * @param {string} redirectHash - Hash to navigate to on success.
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async performSubmit(event, setters, updateCall, redirectHash) {
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    setters.setStatus('submitting');
    setters.setFieldErrors({});

    try {
      const response = await updateCall();

      await this.#handleResponse(response, redirectHash, setters);
    } catch {
      setters.setStatus('error');
    }
  }

  async #handleResponse(response, redirectHash, setters) {
    if (response.ok) {
      this.redirectTo(redirectHash);
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
}
