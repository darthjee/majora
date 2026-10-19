import { UsageError } from '../core/errors/UsageError.js';

/**
 * Placeholder replaced by the (URL-encoded) id in a variant path template.
 * @type {string}
 */
const ID_PLACEHOLDER = ':id';

/**
 * Tells whether an id or slug was not provided (`undefined`, `null` or an empty string).
 * @param {unknown} value - Any value.
 * @returns {boolean} `true` when the value is blank.
 */
export function isBlankSegment(value) {
  return value === undefined || value === null || String(value) === '';
}

/**
 * URL-encodes one path segment (an id or a slug), rejecting blank values.
 * @param {string|number} value - The segment value.
 * @param {string} label - What the value is, for the error message (`id`, `slug`).
 * @returns {string} The encoded segment.
 * @throws {UsageError} When the value is blank.
 */
export function encodeSegment(value, label) {
  if (isBlankSegment(value)) {
    throw new UsageError(`Missing ${label}`);
  }

  return encodeURIComponent(String(value));
}

/**
 * Base resource wrapper, built on the shared `HttpClient` and `Paginator`.
 *
 * Each subclass declares a static **variant map**: `action → { regular, restricted }`, where
 * each entry is a path template relative to the resource's base path (`''` for the base path
 * itself, `':id'` replaced by the URL-encoded id) or `null` when the variant does not exist.
 * An action missing from the map is not supported. Adding a variant later is a one-line
 * change to the map.
 *
 * The regular variant is the default; `{ restricted: true }` selects the restricted one.
 * Asking for a missing action or variant throws `UsageError` locally, before any request,
 * with no automatic fallback.
 *
 * Return values are plain parsed JSON; `list` returns a `Page`.
 */
export class Resource {
  /**
   * Variant map of the resource (`action → { regular, restricted }`); overridden by
   * subclasses.
   * @type {Object<string, {regular: (string|null), restricted: (string|null)}>}
   */
  static variants = {};

  #http;
  #paginator;
  #basePath;

  /**
   * Builds the wrapper.
   * @param {import('../core/HttpClient.js').HttpClient} http - The HTTP layer.
   * @param {import('../core/Paginator.js').Paginator} paginator - The paginator.
   * @param {string} basePath - Base path relative to `baseUrl`, without `.json`
   *   (e.g. `games/epic-quest/npcs`); its segments must already be URL-encoded.
   */
  constructor(http, paginator, basePath) {
    this.#http = http;
    this.#paginator = paginator;
    this.#basePath = basePath;
  }

  /**
   * The base path of the resource (already URL-encoded, without `.json`). Nested
   * sub-resources can be built from it.
   * @returns {string} The base path.
   */
  get basePath() {
    return this.#basePath;
  }

  /**
   * The shared HTTP layer, for subclasses adding their own actions.
   * @returns {import('../core/HttpClient.js').HttpClient} The HTTP client.
   */
  get http() {
    return this.#http;
  }

  /**
   * The shared paginator, for subclasses adding their own list actions.
   * @returns {import('../core/Paginator.js').Paginator} The paginator.
   */
  get paginator() {
    return this.#paginator;
  }

  /**
   * Resolves the request path of an action and variant.
   * @param {string} action - The action (`list`, `get`, `create`, `update`).
   * @param {object} [options] - Resolution options.
   * @param {boolean} [options.restricted] - Select the restricted variant.
   * @param {string|number} [options.id] - The id, for templates containing `:id`.
   * @returns {string} The path, relative to `baseUrl` and without `.json`.
   * @throws {UsageError} When the action or the variant does not exist, or the id is blank.
   */
  pathFor(action, { restricted = false, id } = {}) {
    const template = this.#template(action, restricted);
    const resolved = template.includes(ID_PLACEHOLDER)
      ? template.replace(ID_PLACEHOLDER, () => encodeSegment(id, 'id'))
      : template;

    return resolved === '' ? this.#basePath : `${this.#basePath}/${resolved}`;
  }

  /**
   * Fetches one page of the collection.
   * @param {object} [options] - List options.
   * @param {boolean} [options.restricted] - Use the restricted variant.
   * @param {number} [options.page] - Page number (1-based).
   * @param {number} [options.perPage] - Page size.
   * @param {object} [options.query] - Filters, sent as query parameters.
   * @param {object} [options.headers] - Extra request headers.
   * @param {number} [options.timeout] - Timeout per attempt in ms.
   * @param {number} [options.retries] - Retries for this request.
   * @param {AbortSignal} [options.signal] - Caller abort signal.
   * @returns {Promise<import('../core/Page.js').Page>} The page.
   * @throws {UsageError} When the action or variant does not exist (before any request).
   */
  async list(options = {}) {
    const { restricted, ...rest } = options;

    return this.#paginator.list(this.pathFor('list', { restricted }), rest);
  }

  /**
   * Iterates over every item of the collection, one page at a time. The path is resolved
   * immediately, so a missing variant throws `UsageError` synchronously, before any request.
   * @param {object} [options] - List options (see `list`); `page` sets the first page.
   * @returns {AsyncGenerator<unknown>} The items.
   * @throws {UsageError} When the action or variant does not exist.
   */
  iterate(options = {}) {
    const { restricted, ...rest } = options;

    return this.#paginator.iterate(this.pathFor('list', { restricted }), rest);
  }

  /**
   * Fetches one record.
   * @param {string|number} id - The record id.
   * @param {object} [options] - Request options.
   * @param {boolean} [options.restricted] - Use the restricted variant.
   * @param {object} [options.query] - Query parameters.
   * @param {object} [options.headers] - Extra request headers.
   * @param {number} [options.timeout] - Timeout per attempt in ms.
   * @param {number} [options.retries] - Retries for this request.
   * @param {AbortSignal} [options.signal] - Caller abort signal.
   * @returns {Promise<unknown>} The parsed body.
   * @throws {UsageError} When the action or variant does not exist, or the id is blank.
   */
  async get(id, options = {}) {
    const { restricted, ...rest } = options;
    const { body } = await this.#http.get(this.pathFor('get', { restricted, id }), rest);

    return body;
  }

  /**
   * Creates a record (`POST`).
   * @param {object} data - The record attributes, sent as JSON.
   * @param {object} [options] - Request options (see `get`).
   * @returns {Promise<unknown>} The parsed body.
   * @throws {UsageError} When the action or variant does not exist.
   */
  async create(data, options = {}) {
    const { restricted, ...rest } = options;
    const { body } = await this.#http.post(this.pathFor('create', { restricted }), data, rest);

    return body;
  }

  /**
   * Partially updates a record (`PATCH`).
   * @param {string|number} id - The record id.
   * @param {object} data - The attributes to change, sent as JSON.
   * @param {object} [options] - Request options (see `get`).
   * @returns {Promise<unknown>} The parsed body.
   * @throws {UsageError} When the action or variant does not exist, or the id is blank.
   */
  async update(id, data, options = {}) {
    const { restricted, ...rest } = options;
    const { body } = await this.#http.patch(this.pathFor('update', { restricted, id }), data, rest);

    return body;
  }

  /**
   * A short name of the resource, for error messages.
   * @returns {string} The name.
   */
  get #name() {
    return this.constructor.name;
  }

  /**
   * Looks up the path template of an action and variant.
   * @param {string} action - The action.
   * @param {boolean} restricted - Whether the restricted variant is wanted.
   * @returns {string} The template.
   * @throws {UsageError} When the action or variant does not exist.
   */
  #template(action, restricted) {
    const { variants } = this.constructor;
    const entry = Object.hasOwn(variants, action) ? variants[action] : null;

    if (!entry) {
      throw new UsageError(`${this.#name} does not support ${action}`);
    }

    const variant = restricted ? 'restricted' : 'regular';
    const template = entry[variant];

    if (template === null || template === undefined) {
      throw new UsageError(`${this.#name} has no ${variant} variant for ${action}`);
    }

    return template;
  }
}
