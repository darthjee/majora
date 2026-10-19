import { UsageError } from '../core/errors/UsageError.js';
import { Resource, isBlankSegment } from './Resource.js';

/**
 * Games (top-level, read-only), so callers can discover the slugs their token can reach.
 *
 * Actions: `list` (+ `iterate`) on `games` (paginated, returns a `Page`), `mine()` on
 * `my-games` (not paginated, returns the plain parsed array) and `get(slug)` on
 * `games/<slug>`. There are no restricted variants, and no `create` / `update` / `delete`.
 *
 * @example
 * await client.games.list();               // games.json
 * await client.games.mine();               // my-games.json
 * await client.games.get('epic-quest');    // games/epic-quest.json
 */
export class Games extends Resource {
  static variants = {
    list: { regular: '', restricted: null },
    get: { regular: ':id', restricted: null },
  };

  /**
   * Builds the wrapper.
   * @param {import('../core/HttpClient.js').HttpClient} http - The HTTP layer.
   * @param {import('../core/Paginator.js').Paginator} paginator - The paginator.
   */
  constructor(http, paginator) {
    super(http, paginator, 'games');
  }

  /**
   * Fetches one game.
   * @param {string} slug - The game slug.
   * @param {object} [options] - Request options (`query`, `headers`, `timeout`, `retries`,
   *   `signal`).
   * @returns {Promise<unknown>} The parsed game.
   * @throws {UsageError} When the slug is blank or `restricted` is asked (before any request).
   */
  async get(slug, options = {}) {
    if (isBlankSegment(slug)) {
      throw new UsageError('Missing game slug');
    }

    return super.get(slug, options);
  }

  /**
   * Fetches the games the token's user takes part in (`my-games`, not paginated).
   * @param {object} [options] - Request options (`query`, `headers`, `timeout`, `retries`,
   *   `signal`).
   * @returns {Promise<unknown>} The parsed array of games.
   * @throws {UsageError} When `restricted` is asked (before any request).
   */
  async mine(options = {}) {
    const { restricted, ...rest } = options;

    if (restricted) {
      throw new UsageError('Games has no restricted variant for mine');
    }

    const { body } = await this.http.get('my-games', rest);

    return body;
  }
}
