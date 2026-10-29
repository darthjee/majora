import ApiTokenScopes from '../../../../common/api_tokens/ApiTokenScopes.js';

/**
 * Append scopes to a selection, skipping those already present.
 *
 * @param {Array<string>} value - Current selection.
 * @param {Array<string>} additions - Scopes to add.
 * @returns {Array<string>} The merged selection.
 */
const merge = (value, additions) => [...value, ...additions.filter((scope) => !value.includes(scope))];

/**
 * Build the scopes a ticked scope brings in: itself, plus its family's `read` when it is a
 * `write` scope available in the catalogue ("Write ticks Read", a UI convenience only).
 *
 * @param {string} scope - The ticked scope.
 * @param {Array<string>} available - The scope catalogue from `options.json`.
 * @returns {Array<string>} The scopes to add.
 */
const withRead = (scope, available) => {
  const read = `${ApiTokenScopes.familyOf(scope)}:read`;

  if (ApiTokenScopes.actionOf(scope) === 'write' && available.includes(read)) {
    return [read, scope];
  }

  return [scope];
};

/**
 * Pure selection logic of the API token scope picker (issue #1605), kept out of the component
 * so it can be tested without rendering.
 */
export default class ApiTokenScopeSelection {
  /**
   * Tick or untick one scope.
   *
   * @description Ticking a `write` scope also ticks its family's `read`; unticking only removes
   *   the given scope, so Read can still be unticked by hand.
   * @param {Array<string>} value - Current selection.
   * @param {string} scope - The scope being toggled.
   * @param {boolean} checked - Whether the scope is now ticked.
   * @param {Array<string>} available - The scope catalogue from `options.json`.
   * @returns {Array<string>} The new selection.
   */
  static toggle(value, scope, checked, available) {
    if (!checked) return value.filter((entry) => entry !== scope);

    return merge(value, withRead(scope, available));
  }

  /**
   * Tick every catalogue scope of one action, keeping the rest of the selection.
   *
   * @description "Select all write" also ticks every `read`, following the Write-ticks-Read rule.
   *   Explicit-only scopes (e.g. `statistics:read`) are never added, but stay ticked when they
   *   already were.
   * @param {Array<string>} value - Current selection.
   * @param {Array<string>} available - The scope catalogue from `options.json`.
   * @param {string} action - `'read'` or `'write'`.
   * @returns {Array<string>} The new selection.
   */
  static selectAll(value, available, action) {
    const additions = available
      .filter((scope) => ApiTokenScopes.actionOf(scope) === action)
      .flatMap((scope) => withRead(scope, available))
      .filter((scope) => !ApiTokenScopes.isExplicitOnly(scope));

    return merge(value, additions);
  }

  /**
   * Clear the selection.
   *
   * @returns {Array<string>} An empty selection.
   */
  static clear() {
    return [];
  }
}
