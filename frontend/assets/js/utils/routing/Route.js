/**
 * Route model to match hash paths and extract dynamic params.
 */
export default class Route {
  #regex;

  #page;

  /**
   * Create a route matcher.
   *
   * @param {string} path - Route pattern path.
   * @param {string} page - Page identifier.
   */
  constructor(path, page) {
    const pattern = path
      .split('/')
      .map((segment) => {
        if (segment.startsWith(':')) {
          return `(?<${segment.slice(1)}>[^/]+)`;
        }

        return Route.#escapeRegex(segment);
      })
      .join('/');

    // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr -- `pattern` is always built from a hardcoded, developer-authored route template (see Router#register / Router.extractParams and their callers) — never from runtime URL/hash or other user input. Static segments are pre-escaped via #escapeRegex.
    this.#regex = new RegExp(`^${pattern}/?$`);
    this.#page = page;
  }

  /**
   * Escape regex special chars from static route segments.
   *
   * @param {string} value - Static route segment.
   * @returns {string} Escaped segment.
   */
  static #escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check whether a path matches this route.
   *
   * @param {string} path - Path to check.
   * @returns {boolean} True when path matches.
   */
  matches(path) {
    return this.#regex.test(path);
  }

  /**
   * Extract params for a matching path.
   *
   * @param {string} path - Path to parse.
   * @returns {object} Route params map.
   */
  params(path) {
    const match = path.match(this.#regex);
    return match?.groups ?? {};
  }

  /**
   * Return the page identifier for this route.
   *
   * @returns {string} Page identifier.
   */
  get page() {
    return this.#page;
  }
}
