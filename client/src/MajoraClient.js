import { Config } from './core/Config.js';
import { HttpClient } from './core/HttpClient.js';
import { Paginator } from './core/Paginator.js';

/**
 * Entry point of the Majora client library.
 *
 * Resolves and validates the configuration at construction (throwing
 * `ConfigurationError` before any request), then builds the shared HTTP layer and the
 * paginator the resource wrappers are built on.
 *
 * @example
 * const client = new MajoraClient({ baseUrl: 'https://majora.example.com', token: 'mjr_...' });
 * const { body } = await client.http.get('my-games');
 */
export class MajoraClient {
  #http;
  #paginator;

  /**
   * Builds the client.
   * @param {object} [options] - Client options.
   * @param {string} [options.baseUrl] - API root; falls back to `MAJORA_URL`.
   * @param {string} [options.token] - Scoped API token (`mjr_...`); falls back to
   *   `MAJORA_TOKEN`.
   * @param {number} [options.timeout] - Request timeout in ms (default 30000, `0` disables).
   * @param {number} [options.retries] - Retries for `GET` requests (default 2, `0` disables).
   * @param {Function} [options.fetch] - Fetch implementation (default `globalThis.fetch`).
   * @param {boolean} [options.allowInsecureHttp] - Allow `http://` for any host (e.g.
   *   docker-compose service names); `localhost` / `127.0.0.1` are always allowed.
   * @param {object} [options.env] - Environment to read the fallbacks from (default
   *   `process.env`); meant for tests.
   * @throws {import('./core/errors/ConfigurationError.js').ConfigurationError} When the
   *   configuration is missing, invalid or insecure.
   */
  constructor(options = {}) {
    const config = new Config(options);

    this.#http = new HttpClient(config);
    this.#paginator = new Paginator(this.#http);
  }

  /**
   * The shared HTTP layer (authenticated `.json` requests, retries, error mapping).
   * @returns {HttpClient} The HTTP client.
   */
  get http() {
    return this.#http;
  }

  /**
   * The paginator for list endpoints (`list` and `iterate`).
   * @returns {Paginator} The paginator.
   */
  get paginator() {
    return this.#paginator;
  }
}
