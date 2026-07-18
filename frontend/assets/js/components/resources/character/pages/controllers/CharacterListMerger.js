/**
 * Resolves one of a character's preview list fields (`treasures`, `items`, `photos`) onto a
 * loaded character, degrading to an empty array on failure rather than failing the whole
 * character page load. Shared by `CharacterController#fetchAndMergeTreasures`/
 * `#fetchAndMergeItems`/`#fetchAndMergePhotos`, which only differ in which fetch method and
 * character field they use.
 */
export default class CharacterListMerger {
  /**
   * Merge a fetched list onto the character under `key`, given a pending fetch of that list.
   *
   * @param {object} character - Base character data already loaded.
   * @param {string} key - Character field to merge the resolved list onto (e.g. `'items'`).
   * @param {Promise<Response>} listFetch - Pending fetch of the character's list.
   * @returns {Promise<object>} Resolves to the character with the list applied.
   */
  static merge(character, key, listFetch) {
    return listFetch
      .then((response) => (response.ok ? response.json() : []))
      .then((list) => ({ ...character, [key]: Array.isArray(list) ? list : [] }))
      .catch(() => ({ ...character, [key]: [] }));
  }
}
