import BasePageController from './BasePageController.js';
import Noop from '../../../../utils/Noop.js';
import BaseClient from '../../../../client/BaseClient.js';

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
   * Load the resource for the edit page. Must be implemented by subclasses,
   * which receive the same `(safeSet, isMounted)` arguments passed by
   * {@link BaseEditController#buildEffect} even though this base stub itself
   * declares no parameters (it is never actually invoked once overridden).
   *
   * @returns {void}
   */
  loadResource() {
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
   * Fetch the resource and merge its edit permissions onto it, updating
   * loading/error state.
   *
   * @param {Promise<Response>} resourcePromise - Resource fetch response promise.
   * @param {Promise<{can_edit: boolean}>} permissionsPromise - Permissions payload promise,
   *   already resolved to `{ can_edit }` (e.g. from `AccessStore#ensureXPermissions`, which
   *   never rejects).
   * @param {Function} safeSet - Setter wrapper that ignores unmounted updates.
   * @param {string} errorMessage - Error message set when the resource fetch fails.
   * @returns {void}
   */
  fetchWithAccess(resourcePromise, permissionsPromise, safeSet, errorMessage) {
    Promise.all([
      resourcePromise.then((response) => BaseClient.parseJsonOrReject(response, 'resource failed')),
      permissionsPromise,
    ])
      .then(([resource, permissions]) => safeSet(this.setResource, { ...resource, ...permissions }))
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
      .then((response) => BaseClient.parseJsonOrReject(response, 'resource failed'))
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
