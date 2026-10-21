import { Resource, encodeSegment } from './Resource.js';

/**
 * Shared base for the link sub-wrappers of one character
 * (`games/<slug>/<npcs|pcs>/<character_id>/<items|documents|factions>`), reached through
 * `npcs.items(characterId)`, `pcs.factions(characterId)`, ... (see `CharacterItems`,
 * `CharacterDocuments` and `CharacterFactions`).
 *
 * Actions: `list` (+ `iterate`), `get(linkedId)`, `available()` (+ `iterateAvailable`),
 * `acquire(data)` and `remove(...)`. Every action has a regular and a restricted variant.
 * `acquire` and `remove` are `POST`s, so they are never retried; their bodies are sent
 * as-is. There is no `create` nor `update`: they throw `UsageError`, before any request.
 *
 * Scopes are enforced by the API: a link write needs `write` on the character family (the
 * one the URL nests under), and the restricted `acquire` / `remove` also need `read` on the
 * linked family.
 */
export class CharacterLinks extends Resource {
  /**
   * Path segment of the linked family under the character (`items`, `documents`,
   * `factions`); overridden by subclasses.
   * @type {string}
   */
  static segment = '';

  #characterId;

  /**
   * Builds the wrapper.
   * @param {import('../core/HttpClient.js').HttpClient} http - The HTTP layer.
   * @param {import('../core/Paginator.js').Paginator} paginator - The paginator.
   * @param {string} characterBasePath - Base path of the parent character wrapper (already
   *   URL-encoded, e.g. `games/epic-quest/npcs`).
   * @param {string|number} characterId - The character id.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the character id is blank.
   */
  constructor(http, paginator, characterBasePath, characterId) {
    super(
      http,
      paginator,
      `${characterBasePath}/${encodeSegment(characterId, 'character id')}/${new.target.segment}`,
    );
    this.#characterId = characterId;
  }

  /**
   * The character id this wrapper is bound to.
   * @returns {string|number} The character id.
   */
  get characterId() {
    return this.#characterId;
  }

  /**
   * Fetches one page of the records the character can acquire (`available`).
   * @param {object} [options] - List options (see `Resource#list`).
   * @param {boolean} [options.restricted] - Use the restricted variant (`available/all`).
   * @returns {Promise<import('../core/Page.js').Page>} The page.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the variant does not exist.
   */
  async available(options = {}) {
    const { restricted, ...rest } = options;

    return this.paginator.list(this.pathFor('available', { restricted }), rest);
  }

  /**
   * Iterates over every record the character can acquire, one page at a time. The path is
   * resolved immediately, so a missing variant throws `UsageError` synchronously.
   * @param {object} [options] - List options (see `available`); `page` sets the first page.
   * @returns {AsyncGenerator<unknown>} The records.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the variant does not exist.
   */
  iterateAvailable(options = {}) {
    const { restricted, ...rest } = options;

    return this.paginator.iterate(this.pathFor('available', { restricted }), rest);
  }

  /**
   * Links records to the character (`POST acquire`, never retried). The body is sent as-is.
   * @param {object} data - The body (e.g. `{ game_item_id: 3 }`).
   * @param {object} [options] - Request options.
   * @param {boolean} [options.restricted] - Use the restricted variant (`acquire/all`).
   * @param {object} [options.headers] - Extra request headers.
   * @param {number} [options.timeout] - Timeout per attempt in ms.
   * @param {AbortSignal} [options.signal] - Caller abort signal.
   * @returns {Promise<unknown>} The parsed body.
   */
  async acquire(data, options = {}) {
    const { restricted, ...rest } = options;
    const { body } = await this.http.post(this.pathFor('acquire', { restricted }), data, rest);

    return body;
  }

  /**
   * Unlinks records from the character (`POST remove`, never retried). The body, which
   * names the target, is sent as-is.
   * @param {object} data - The body (e.g. `{ game_item_id: 3 }`).
   * @param {object} [options] - Request options (see `acquire`).
   * @returns {Promise<unknown>} The parsed body.
   */
  async remove(data, options = {}) {
    const { restricted, ...rest } = options;
    const { body } = await this.http.post(this.pathFor('remove', { restricted }), data, rest);

    return body;
  }
}
