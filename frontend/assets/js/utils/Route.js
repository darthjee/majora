/**
 * Escape regex special chars from static route segments.
 *
 * @param {string} value - Static route segment.
 * @returns {string} Escaped segment.
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

        return escapeRegex(segment);
      })
      .join('/');

    this.#regex = new RegExp(`^${pattern}/?$`);
    this.#page = page;
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
