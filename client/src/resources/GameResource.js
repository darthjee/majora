import { Resource, encodeSegment } from './Resource.js';

/**
 * Base wrapper for game-scoped families, whose base path is `games/<slug>/<family>`.
 *
 * Subclasses declare their `static family` (the URL segment, e.g. `npcs`) and their
 * `static variants` (see `Resource`).
 */
export class GameResource extends Resource {
  /**
   * URL segment of the family under `games/<slug>/`; overridden by subclasses.
   * @type {string}
   */
  static family = '';

  #slug;

  /**
   * Builds the wrapper.
   * @param {import('../core/HttpClient.js').HttpClient} http - The HTTP layer.
   * @param {import('../core/Paginator.js').Paginator} paginator - The paginator.
   * @param {string} slug - The game slug.
   * @throws {import('../core/errors/UsageError.js').UsageError} When the slug is blank.
   */
  constructor(http, paginator, slug) {
    super(http, paginator, `games/${encodeSegment(slug, 'game slug')}/${new.target.family}`);
    this.#slug = slug;
  }

  /**
   * The game slug this wrapper is bound to.
   * @returns {string} The slug.
   */
  get slug() {
    return this.#slug;
  }
}
