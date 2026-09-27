/**
 * Maximum number of sessions the task session picker lists per search.
 */
export const SESSION_PICKER_MAX_ENTRIES = 5;

/**
 * Build the API-mode `picker` config for a task's session `SingleResourcePickerField`: searches
 * the game's sessions (`GET /games/:game_slug/sessions.json`) by name, capped at
 * `SESSION_PICKER_MAX_ENTRIES` results.
 *
 * @param {string} gameSlug - Slug of the game whose sessions are searched.
 * @returns {{resource: string, maxEntries: number, params: {gameSlug: string}}} Picker config.
 */
export function buildSessionPicker(gameSlug) {
  return { resource: 'session', maxEntries: SESSION_PICKER_MAX_ENTRIES, params: { gameSlug } };
}

/**
 * Shape a task's nested `session` (`{id, title}`) as the `{id, name}` item
 * `SingleResourcePickerField` expects for its `value` prop.
 *
 * @param {{id: number, title: string}|null|undefined} session - The task's session, if any.
 * @returns {{id: number, name: string}|null} Picker item, or null when there is no session.
 */
export function toTaskSessionPick(session) {
  if (!session) {
    return null;
  }

  return { id: session.id, name: session.title };
}
