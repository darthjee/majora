/**
 * Resource name (`'pc'`/`'npc'`) `RequestStore`/`resourceConfig` key for a character kind
 * (`'pcs'`/`'npcs'`).
 *
 * @param {string} characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @returns {string} `'pc'` or `'npc'`.
 */
export default function resourceName(characterKind) {
  return characterKind === 'npcs' ? 'npc' : 'pc';
}
