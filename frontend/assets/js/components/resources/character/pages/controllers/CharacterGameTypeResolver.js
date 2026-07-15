/**
 * Resolves a character's own game currency type (`game_type`) onto a
 * loaded character, so money display/editing can pick the right currency
 * model. `Character.money` itself carries no currency-type field — it is
 * derived live from the character's own game.
 */
export default class CharacterGameTypeResolver {
  /**
   * Merge a character's own game `game_type` onto the character, given a
   * pending fetch of that game. Degrades to `'dnd'` when the fetch fails or
   * the response is not ok, rather than failing the whole character page
   * load.
   *
   * @param {object} character - Base character data already loaded.
   * @param {Promise<Response>} gameFetch - Pending fetch of the character's own game.
   * @returns {Promise<object>} Resolves to the character with game_type applied.
   */
  static merge(character, gameFetch) {
    return gameFetch
      .then((response) => (response.ok ? response.json() : null))
      .then((game) => ({ ...character, game_type: game?.game_type ?? 'dnd' }))
      .catch(() => ({ ...character, game_type: 'dnd' }));
  }
}
