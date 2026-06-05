import Route from './Route.js';

/**
 * Route registry and resolver.
 */
export default class Router {
  #routes = [];

  /**
   * Register a route and page mapping.
   *
   * @param {string} path - Route pattern path.
   * @param {string} page - Page identifier.
   * @returns {void}
   */
  register(path, page) {
    this.#routes.push(new Route(path, page));
  }

  /**
   * Resolve a path into a page identifier.
   *
   * @param {string} path - Path to resolve.
   * @returns {string} Page identifier or home.
   */
  resolve(path) {
    const match = this.#routes.find((route) => route.matches(path));
    return match ? match.page : 'home';
  }

  /**
   * Extract params from a path and hash value.
   *
   * @param {string} path - Route pattern to parse.
   * @param {string} hash - Hash value with optional query params.
   * @returns {object} Route params map.
   */
  static extractParams(path, hash = '') {
    const normalizedHash = String(hash).split('?')[0].replace(/^#/, '');
    return new Route(path, 'tmp').params(normalizedHash);
  }
}
