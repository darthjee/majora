import RequestStore from '../../../../../utils/requests/RequestStore.js';
import resourceConfig from '../../../../../utils/requests/resourceConfig.js';

/**
 * Resolves the permission-aware `GET` paths for a PC's or NPC's own detail and photo gallery,
 * for controllers whose HTTP dispatch goes through {@link CharacterClient}/`GenericClient` rather
 * than {@link RequestStore.ensure}.
 *
 * @description The plain NPC routes (`npcs/:id.json`, `npcs/:id/photos.json`) 404 on a hidden
 *   NPC for every caller, editors included (issue #1616), so an editor must read the restricted
 *   siblings (`npcs/:id/full.json`, `npcs/:id/photos/all.json`). Both paths are resolved through
 *   {@link RequestStore.resolvePath} against the `pc`/`npc` `GET.single` and `characterPhoto`
 *   `GET.collection` configs, so the regular-vs-private choice stays in `resourceConfig`. When
 *   the permission lookup itself fails, both fall back to the regular (plain) path (fail-closed).
 */
export default class CharacterRequestPaths {
  /**
   * Resolve the character detail path (`.../full.json` for an editor, the plain path otherwise).
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {Promise<string>} Resolves to the character detail path.
   */
  static character(characterKind, gameSlug, characterId) {
    return CharacterRequestPaths.#resolve(
      characterKind === 'npcs' ? 'npc' : 'pc', 'single', { gameSlug, id: characterId },
    );
  }

  /**
   * Resolve the character photo gallery path (`npcs/:id/photos/all.json` for an NPC editor, the
   * plain `photos.json` otherwise).
   *
   * @param {string} characterKind - Character kind (`'pcs'` or `'npcs'`).
   * @param {string} gameSlug - Game slug the character belongs to.
   * @param {string|number} characterId - Character id.
   * @returns {Promise<string>} Resolves to the photo gallery path.
   */
  static photos(characterKind, gameSlug, characterId) {
    return CharacterRequestPaths.#resolve(
      'characterPhoto', 'collection', { gameSlug, kind: characterKind, id: characterId },
    );
  }

  static #resolve(resource, quantityType, params) {
    return RequestStore.resolvePath({
      resource, method: 'GET', quantityType, params,
    }).catch(() => resourceConfig.get('GET', resource, quantityType).regular.path(params));
  }
}
