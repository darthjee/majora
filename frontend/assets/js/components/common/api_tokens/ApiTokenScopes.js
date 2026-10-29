/**
 * UI-only grouping of the scope families (`backend/accounts/scopes.py` `FAMILIES`), in display
 * order. It is never sent to the API: the scopes themselves always come from `options.json` or
 * from a token's own `scopes` list. The `statistics` group (staff-only, read-only
 * `statistics:read`) is last; `options.json` only offers it to staff users.
 *
 * @type {Array<{group: string, families: Array<string>}>}
 */
const SCOPE_GROUPS = [
  { group: 'game', families: ['games', 'players', 'sessions', 'polls', 'tasks', 'conversations'] },
  { group: 'characters', families: ['pcs', 'npcs', 'factions'] },
  { group: 'documents', families: ['documents'] },
  { group: 'inventory', families: ['items', 'common_items', 'possessions', 'recipes', 'treasures'] },
  { group: 'miniatures', families: ['miniatures'] },
  { group: 'statistics', families: ['statistics'] },
];

/**
 * Sensitive scopes that the "Select all" shortcuts never tick, so they can only be granted on
 * purpose, by ticking their own checkbox.
 *
 * @type {Array<string>}
 */
const EXPLICIT_ONLY = ['statistics:read'];

/**
 * Helpers for the `"<family>:<action>"` scope strings of scoped API tokens (issue #1605).
 *
 * @description Shared by the owner token page and the staff token panel, both for the list's
 *   scope badges and for the create form's scope picker.
 */
export default class ApiTokenScopes {
  /**
   * The UI-only family groups, in display order.
   *
   * @returns {Array<{group: string, families: Array<string>}>} The family groups.
   */
  static get GROUPS() {
    return SCOPE_GROUPS;
  }

  /**
   * The sensitive scopes the "Select all" shortcuts skip.
   *
   * @returns {Array<string>} The explicit-only scope strings.
   */
  static get EXPLICIT_ONLY() {
    return EXPLICIT_ONLY;
  }

  /**
   * Check whether a scope can only be ticked on purpose (never by "Select all").
   *
   * @param {string} scope - A scope string, e.g. `'statistics:read'`.
   * @returns {boolean} Whether the scope is explicit-only.
   */
  static isExplicitOnly(scope) {
    return EXPLICIT_ONLY.includes(scope);
  }

  /**
   * Extract the family part of a scope string.
   *
   * @param {string} scope - A scope string, e.g. `'npcs:write'`.
   * @returns {string} The family, e.g. `'npcs'`.
   */
  static familyOf(scope) {
    return scope.split(':')[0];
  }

  /**
   * Extract the action part of a scope string.
   *
   * @param {string} scope - A scope string, e.g. `'npcs:write'`.
   * @returns {string} The action (`'read'` or `'write'`).
   */
  static actionOf(scope) {
    return scope.split(':')[1];
  }

  /**
   * Group a list of scope strings by family group, in display order.
   *
   * @description Families missing from the UI constant are dropped (so a catalogue that grows
   *   never breaks the UI), as are families with no scope in the list and groups with no family
   *   left.
   * @param {Array<string>} scopes - Scope strings, e.g. `['npcs:read', 'npcs:write']`.
   * @returns {Array<{group: string, families: Array<{family: string, read: boolean,
   *   write: boolean}>}>} The grouped families, each flagged with the actions present.
   */
  static groupScopes(scopes) {
    const present = new Set(scopes);

    return SCOPE_GROUPS
      .map(({ group, families }) => ({
        group,
        families: families
          .map((family) => ({
            family,
            read: present.has(`${family}:read`),
            write: present.has(`${family}:write`),
          }))
          .filter(({ read, write }) => read || write),
      }))
      .filter(({ families }) => families.length > 0);
  }
}
