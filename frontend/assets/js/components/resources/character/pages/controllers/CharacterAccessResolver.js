import AccessStore from '../../../../../utils/access/store/AccessStore.js';

/**
 * Resolves a character's access/edit-permission data (fail-closed reads
 * from {@link AccessStore}) onto a loaded character.
 */
export default class CharacterAccessResolver {
  /**
   * Merge access (`is_player`, `is_staff`) and permission (`can_edit`) data
   * onto a character, tagging the result with whether it reflects a
   * fail-closed pass or the real, resolved data.
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {object} character - Base character data already loaded.
   * @param {object} params - Route params with game_slug and character_id.
   * @param {boolean} resolved - Whether this pass reflects the real
   *   access/permissions data (vs. a not-yet-known fail-closed pass).
   * @returns {object} Character merged with access/permission data.
   */
  static merge(characterKind, character, params, resolved) {
    const access = AccessStore.getCharacterAccess(characterKind, params.game_slug, params.character_id);
    const permissions = AccessStore.getCharacterPermissions(characterKind, params.game_slug, params.character_id);

    return {
      ...character,
      can_edit: permissions.can_edit,
      is_player: access.is_player,
      is_staff: Boolean(access.is_staff),
      access_resolved: resolved,
    };
  }
}
