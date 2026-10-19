import { Config } from './core/Config.js';
import { HttpClient } from './core/HttpClient.js';
import { Paginator } from './core/Paginator.js';
import { UsageError } from './core/errors/UsageError.js';
import { Documents } from './resources/Documents.js';
import { Factions } from './resources/Factions.js';
import { Games } from './resources/Games.js';
import { Items } from './resources/Items.js';
import { Npcs } from './resources/Npcs.js';
import { Pcs } from './resources/Pcs.js';
import { isBlankSegment } from './resources/Resource.js';

/**
 * Entry point of the Majora client library.
 *
 * Resolves and validates the configuration at construction (throwing
 * `ConfigurationError` before any request), then builds the shared HTTP layer and the
 * paginator the resource wrappers are built on. Top-level, read-only games hang off
 * `client.games`; game-scoped families hang off `client.game(slug)`.
 *
 * @example
 * const client = new MajoraClient({ baseUrl: 'https://majora.example.com', token: 'mjr_...' });
 * const games = await client.games.mine();
 * const page = await client.game('epic-quest').npcs.list({ page: 2 });
 */
export class MajoraClient {
  #http;
  #paginator;
  #games;

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
    this.#games = new Games(this.#http, this.#paginator);
  }

  /**
   * The top-level, read-only games wrapper (`list`, `iterate`, `mine`, `get`).
   * @returns {Games} The games wrapper.
   */
  get games() {
    return this.#games;
  }

  /**
   * The game-scoped wrappers bound to one game. Builds them without any request.
   * @param {string} slug - The game slug.
   * @returns {{slug: string, npcs: Npcs, pcs: Pcs, factions: Factions, items: Items,
   *   documents: Documents}} The wrappers of that game (frozen).
   * @throws {UsageError} When the slug is missing or empty.
   */
  game(slug) {
    if (isBlankSegment(slug)) {
      throw new UsageError('Missing game slug');
    }

    const http = this.#http;
    const paginator = this.#paginator;

    return Object.freeze({
      slug,
      npcs: new Npcs(http, paginator, slug),
      pcs: new Pcs(http, paginator, slug),
      factions: new Factions(http, paginator, slug),
      items: new Items(http, paginator, slug),
      documents: new Documents(http, paginator, slug),
    });
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
