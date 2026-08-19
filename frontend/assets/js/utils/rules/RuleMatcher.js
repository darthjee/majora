import MajoraLogger from '../logging/MajoraLogger.js';

/**
 * Generic, header-agnostic evaluator for `{all, any, none, exists}`-shaped declarative
 * rule sets against a flat context object (typically {@link
 * import('../context/CurrentPageContext.js').default}'s output). Replaces per-entry
 * predicate *functions* with reusable rule *data* — e.g. a shared `{ all: ['loggedIn'] }`
 * fragment can be referenced by every logged-in-gated registry entry. Deliberately has no
 * `custom: (context) => boolean` escape hatch — strict declarative vocabulary only.
 */
export default class RuleMatcher {
  /**
   * Evaluates whether `rules` matches `context`.
   *
   * @param {{all: (string[]|undefined), any: (string[]|undefined), none: (string[]|undefined), exists: (string[]|undefined)}} rules - Declarative rule set: `all` (every named field truthy), `any` (at least one named field truthy), `none` (every named field falsy), `exists` (every named field non-null).
   * @param {object} context - Context object the rule's field names are read from.
   * @returns {boolean} `true` when every rule group present in `rules` is satisfied.
   */
  static matches(rules, context) {
    if (!rules || Object.keys(rules).length === 0) {
      MajoraLogger.warn('RuleMatcher: entry has a missing or empty rules object');
      return false;
    }

    return RuleMatcher.#matchesAll(rules.all, context)
      && RuleMatcher.#matchesAny(rules.any, context)
      && RuleMatcher.#matchesNone(rules.none, context)
      && RuleMatcher.#matchesExists(rules.exists, context);
  }

  /**
   * Reads `field` off `context`, warning when `field` is absent from `context` — since
   * `CurrentPageContext.build` always produces a defined value for every real field,
   * genuine absence reliably signals a typo'd field name rather than a legitimate
   * falsy/absent state.
   *
   * @param {string} field - Context field name to read.
   * @param {object} context - Context object to read `field` from.
   * @returns {*} `context[field]`'s value (possibly `undefined`).
   */
  static #readField(field, context) {
    if (!(field in context)) {
      MajoraLogger.warn(`RuleMatcher: rule references unknown field "${field}"`);
    }

    return context[field];
  }

  /**
   * Evaluates an `all` rule group: every named field must be truthy. An absent group
   * (`fields` is `undefined`) is vacuously satisfied.
   *
   * @param {string[]|undefined} fields - Context field names, or `undefined` when this rule group is absent.
   * @param {object} context - Context object the field names are read from.
   * @returns {boolean} `true` when every named field is truthy (or `fields` is absent).
   */
  static #matchesAll(fields, context) {
    return !fields || fields.every((field) => RuleMatcher.#readField(field, context));
  }

  /**
   * Evaluates an `any` rule group: at least one named field must be truthy. An absent
   * group (`fields` is `undefined`) is vacuously satisfied.
   *
   * @param {string[]|undefined} fields - Context field names, or `undefined` when this rule group is absent.
   * @param {object} context - Context object the field names are read from.
   * @returns {boolean} `true` when at least one named field is truthy (or `fields` is absent).
   */
  static #matchesAny(fields, context) {
    return !fields || fields.some((field) => RuleMatcher.#readField(field, context));
  }

  /**
   * Evaluates a `none` rule group: every named field must be falsy. An absent group
   * (`fields` is `undefined`) is vacuously satisfied.
   *
   * @param {string[]|undefined} fields - Context field names, or `undefined` when this rule group is absent.
   * @param {object} context - Context object the field names are read from.
   * @returns {boolean} `true` when every named field is falsy (or `fields` is absent).
   */
  static #matchesNone(fields, context) {
    return !fields || fields.every((field) => !RuleMatcher.#readField(field, context));
  }

  /**
   * Evaluates an `exists` rule group: every named field must be non-`null`/non-`undefined`
   * (needed for fields like `testEmailStatus`, a string rather than a boolean). An absent
   * group (`fields` is `undefined`) is vacuously satisfied.
   *
   * @param {string[]|undefined} fields - Context field names, or `undefined` when this rule group is absent.
   * @param {object} context - Context object the field names are read from.
   * @returns {boolean} `true` when every named field is non-null (or `fields` is absent).
   */
  static #matchesExists(fields, context) {
    return !fields || fields.every((field) => {
      const value = RuleMatcher.#readField(field, context);

      return value !== null && value !== undefined;
    });
  }
}
