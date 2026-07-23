/**
 * Resolves one of a character's preview list fields onto a loaded character, degrading to an
 * empty array on failure rather than failing the whole character page load. `merge` handles the
 * `Response`-based path, currently only used by `CharacterController#fetchAndMergePhotos`;
 * `mergeResource` handles the `RequestStore.ensure()`-based path used by
 * `CharacterListsController#fetchAndMergeTreasures`/`#fetchAndMergeItems`/
 * `#fetchAndMergeDocuments`.
 */
export default class CharacterListMerger {
  /**
   * Merge a fetched list onto the character under `key`, given a pending fetch of that list.
   *
   * @param {object} character - Base character data already loaded.
   * @param {string} key - Character field to merge the resolved list onto (e.g. `'photos'`).
   * @param {Promise<Response>} listFetch - Pending fetch of the character's list.
   * @returns {Promise<object>} Resolves to the character with the list applied.
   */
  static merge(character, key, listFetch) {
    return listFetch
      .then((response) => (response.ok ? response.json() : []))
      .then((list) => ({ ...character, [key]: Array.isArray(list) ? list : [] }))
      .catch(() => ({ ...character, [key]: [] }));
  }

  /**
   * Merge a `RequestStore.ensure()`-resolved list onto the character under `key`, degrading to
   * an empty array on failure.
   *
   * @param {object} character - Base character data already loaded.
   * @param {string} key - Character field to merge the resolved list onto (e.g. `'items'`).
   * @param {Promise<{data: object[], pagination: object}>} requestPromise - Pending
   *   `RequestStore.ensure()` call for the character's list.
   * @returns {Promise<object>} Resolves to the character with the list applied.
   */
  static mergeResource(character, key, requestPromise) {
    return requestPromise
      .then(({ data }) => ({ ...character, [key]: Array.isArray(data) ? data : [] }))
      .catch(() => ({ ...character, [key]: [] }));
  }
}
