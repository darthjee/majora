import { ConfigurationError } from './errors/ConfigurationError.js';

/**
 * Default request timeout, in milliseconds.
 * @type {number}
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Default number of retries for safe requests.
 * @type {number}
 */
export const DEFAULT_RETRIES = 2;

/**
 * Hosts allowed over plain `http://` without `allowInsecureHttp`.
 * @type {string[]}
 */
const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

/**
 * Tells whether a value was not provided (`undefined`, `null` or an empty string).
 * @param {unknown} value - Any value.
 * @returns {boolean} `true` when the value is blank.
 */
function isBlank(value) {
  return value === undefined || value === null || value === '';
}

/**
 * Parses a base URL, rejecting anything that is not an absolute http(s) URL.
 * @param {string} baseUrl - The raw base URL.
 * @returns {URL} The parsed URL.
 * @throws {ConfigurationError} When the URL is invalid.
 */
function parseUrl(baseUrl) {
  let url;

  try {
    url = new URL(baseUrl);
  } catch {
    throw new ConfigurationError(`Invalid baseUrl: ${baseUrl}`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ConfigurationError(`baseUrl must be an http(s) URL: ${baseUrl}`);
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new ConfigurationError('baseUrl must not contain credentials, a query or a fragment');
  }

  return url;
}

/**
 * Resolves and validates the base URL.
 * @param {string|undefined} baseUrl - The `baseUrl` option, or `undefined`.
 * @param {object} env - Environment variables.
 * @param {boolean} allowInsecureHttp - Whether plain HTTP is allowed for any host.
 * @returns {string} The normalized base URL, without trailing slash.
 * @throws {ConfigurationError} When the URL is missing, invalid or insecure.
 */
function resolveBaseUrl(baseUrl, env, allowInsecureHttp) {
  const raw = isBlank(baseUrl) ? env.MAJORA_URL : baseUrl;

  if (isBlank(raw)) {
    throw new ConfigurationError('Missing baseUrl: pass { baseUrl } or set MAJORA_URL');
  }

  const normalized = String(raw).replace(/\/+$/, '');
  const url = parseUrl(normalized);

  if (url.protocol === 'http:' && !allowInsecureHttp && !LOCAL_HOSTS.includes(url.hostname)) {
    throw new ConfigurationError(
      `Insecure baseUrl ${normalized}: use https, or pass { allowInsecureHttp: true }`,
    );
  }

  return normalized;
}

/**
 * Resolves the token. The token never appears in error messages.
 * @param {string|undefined} token - The `token` option, or `undefined`.
 * @param {object} env - Environment variables.
 * @returns {string} The token.
 * @throws {ConfigurationError} When no token is available.
 */
function resolveToken(token, env) {
  const resolved = isBlank(token) ? env.MAJORA_TOKEN : token;

  if (isBlank(resolved) || typeof resolved !== 'string') {
    throw new ConfigurationError('Missing token: pass { token } or set MAJORA_TOKEN');
  }

  return resolved;
}

/**
 * Resolves a non-negative integer option.
 * @param {string} name - Option name, for the error message.
 * @param {unknown} value - The option value, or `undefined`.
 * @param {number} fallback - Default value.
 * @returns {number} The resolved value.
 * @throws {ConfigurationError} When the value is negative or not an integer.
 */
function resolveCount(name, value, fallback) {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new ConfigurationError(`${name} must be a non-negative integer`);
  }

  return value;
}

/**
 * Resolves the fetch implementation.
 * @param {unknown} fetchImpl - The `fetch` option, or `undefined`.
 * @returns {Function} The fetch implementation.
 * @throws {ConfigurationError} When it is not a function.
 */
function resolveFetch(fetchImpl) {
  const resolved = fetchImpl === undefined ? globalThis.fetch : fetchImpl;

  if (typeof resolved !== 'function') {
    throw new ConfigurationError('fetch must be a function');
  }

  return resolved;
}

/**
 * Resolved and validated client configuration.
 *
 * `baseUrl` and `token` fall back to the `MAJORA_URL` and `MAJORA_TOKEN` environment
 * variables. Any invalid value throws `ConfigurationError` here, before any request.
 * The instance is frozen; `token` is not enumerable, so it does not show up when the
 * configuration is logged or serialized.
 */
export class Config {
  /**
   * Resolves and validates the options.
   * @param {object} [options] - Client options.
   * @param {string} [options.baseUrl] - API root, e.g. `https://majora.example.com`.
   * @param {string} [options.token] - Scoped API token (`mjr_...`).
   * @param {number} [options.timeout] - Request timeout in ms (default 30000, `0` disables).
   * @param {number} [options.retries] - Retries for `GET` requests (default 2, `0` disables).
   * @param {Function} [options.fetch] - Fetch implementation (default `globalThis.fetch`).
   * @param {boolean} [options.allowInsecureHttp] - Allow `http://` for any host.
   * @param {object} [options.env] - Environment variables (default `process.env`).
   * @throws {ConfigurationError} When an option is missing or invalid.
   */
  constructor({
    baseUrl, token, timeout, retries, fetch, allowInsecureHttp = false, env = process.env,
  } = {}) {
    this.baseUrl = resolveBaseUrl(baseUrl, env || {}, allowInsecureHttp === true);
    Object.defineProperty(this, 'token', { value: resolveToken(token, env || {}), enumerable: false });
    this.timeout = resolveCount('timeout', timeout, DEFAULT_TIMEOUT);
    this.retries = resolveCount('retries', retries, DEFAULT_RETRIES);
    this.fetch = resolveFetch(fetch);
    Object.freeze(this);
  }
}
