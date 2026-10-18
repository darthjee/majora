import RequestStore from '../../../../../../utils/requests/RequestStore.js';
import ApiTokenExpiry from '../ApiTokenExpiry.js';

/**
 * Controller for the create API token modal (issue #1605): builds and submits the create
 * request and copies the created secret.
 *
 * @description The plain token secret only ever goes from the create response's `.json()` into
 *   the modal's own React state through `setSecret`: it is never written to `RequestStore`,
 *   browser storage, the URL or the console.
 */
export default class CreateApiTokenModalController {
  /**
   * Create a create API token modal controller.
   *
   * @param {{setStatus: Function, setFieldErrors: Function, setSecret: Function,
   *   setCopyStatus: Function}} setters - Modal state setters.
   */
  constructor(setters) {
    this.setters = setters;
  }

  /**
   * The initial form values.
   *
   * @returns {{name: string, scopes: Array<string>, games: Array<object>,
   *   expiry: {choice: string, customDate: string}}} The empty form.
   */
  static emptyForm() {
    return {
      name: '', scopes: [], games: [], expiry: ApiTokenExpiry.DEFAULT,
    };
  }

  /**
   * Whether the Create button is enabled.
   *
   * @param {{scopes: Array<string>, expiry: {choice: string, customDate: string}}} form -
   *   Current form values.
   * @param {string} status - Current status (`'idle'`, `'submitting'` or `'error'`).
   * @param {object|null} options - The loaded `options.json` payload, or `null`.
   * @returns {boolean} `true` when at least one scope is ticked, the expiry is complete (a
   *   custom expiry has a date), nothing is in flight and the options loaded.
   */
  static canSubmit(form, status, options) {
    return form.scopes.length > 0
      && ApiTokenExpiry.isComplete(form.expiry)
      && status !== 'submitting'
      && Boolean(options);
  }

  /**
   * Build the create request body from the form values.
   *
   * @param {{name: string, scopes: Array<string>, games: Array<{slug: string}>,
   *   expiry: {choice: string, customDate: string}}} form - Current form values.
   * @param {Date} [now] - The current time, for the expiry presets.
   * @returns {{name: string, scopes: Array<string>, games: Array<string>,
   *   expires_at: (string|null)}} The request body.
   */
  static buildBody(form, now = new Date()) {
    return {
      name: form.name.trim(),
      scopes: form.scopes,
      games: form.games.map(({ slug }) => slug),
      expires_at: ApiTokenExpiry.toExpiresAt(form.expiry, now),
    };
  }

  /**
   * Submit the create request.
   *
   * @description On 201 the token and its name go to `setSecret`; on 400 the `errors` body goes
   *   to the field errors; on any other failure the status becomes `'error'`, keeping the form
   *   values for a retry.
   * @param {Event|undefined} event - Form submit event, if any.
   * @param {object} form - Current form values (see `buildBody`).
   * @returns {Promise<void>} Resolves when the request handling finishes.
   */
  async submit(event, form) {
    event?.preventDefault?.();
    this.setters.setStatus('submitting');
    this.setters.setFieldErrors({});

    try {
      const response = await RequestStore.mutate({
        componentName: 'CreateApiTokenModal',
        resource: 'apiToken',
        method: 'POST',
        quantityType: 'collection',
        body: CreateApiTokenModalController.buildBody(form),
      });

      await this.#handleResponse(response);
    } catch {
      this.setters.setStatus('error');
    }
  }

  /**
   * Copy the secret to the clipboard, reporting success or a visible failure.
   *
   * @param {string} token - The plain token secret.
   * @returns {Promise<void>} Resolves when the copy attempt finishes.
   */
  async copy(token) {
    try {
      await navigator.clipboard.writeText(token);
      this.setters.setCopyStatus('copied');
    } catch {
      this.setters.setCopyStatus('failed');
    }
  }

  async #handleResponse(response) {
    if (response.ok) {
      const data = await response.json();

      this.setters.setSecret({ token: data.token, name: data.name });
      this.setters.setStatus('idle');
      return;
    }

    if (response.status === 400) {
      const data = await response.json();

      this.setters.setFieldErrors(data.errors ?? {});
      this.setters.setStatus('idle');
      return;
    }

    this.setters.setStatus('error');
  }
}
