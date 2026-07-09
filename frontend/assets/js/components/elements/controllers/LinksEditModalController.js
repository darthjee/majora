/**
 * Pure array-transformation logic for the {@link LinksEditModal} local links
 * state, kept independent of React so it can be unit tested directly.
 */
export default class LinksEditModalController {
  /**
   * Builds a local links array seeded from the character's current links,
   * cloning each entry so local edits do not mutate the caller's objects.
   *
   * @param {object[]} [links] - Character's current links array.
   * @returns {object[]} Cloned local links array.
   */
  static seedLinks(links) {
    return (links ?? []).map((link) => ({ ...link }));
  }

  /**
   * Appends a new, empty, non-persisted link entry.
   *
   * @param {object[]} links - Current local links array.
   * @returns {object[]} Links array with the new entry appended.
   */
  static addLink(links) {
    return [...links, { text: '', url: '', link_type: '' }];
  }

  /**
   * Merges field changes into the local link entry at the given index.
   *
   * @param {object[]} links - Current local links array.
   * @param {number} index - Index of the entry to update.
   * @param {object} changes - Partial link fields to merge into the entry.
   * @returns {object[]} Links array with the entry updated.
   */
  static updateLink(links, index, changes) {
    return links.map((link, i) => (i === index ? { ...link, ...changes } : link));
  }

  /**
   * Toggles the delete state of the local link entry at the given index,
   * following the persisted/non-persisted delete semantics: a persisted
   * link (has an `id`) has its `delete` flag toggled so it can still be
   * sent to the backend; a non-persisted link is removed entirely.
   *
   * @param {object[]} links - Current local links array.
   * @param {number} index - Index of the entry to toggle.
   * @returns {object[]} Links array with the entry toggled or removed.
   */
  static toggleDelete(links, index) {
    const link = links[index];

    if (!link.id) {
      return links.filter((_, i) => i !== index);
    }

    return links.map((entry, i) => (i === index ? { ...entry, delete: !entry.delete } : entry));
  }

  /**
   * Determines whether every active (non-deleted) link entry has a non-blank
   * URL, i.e. whether the modal's local links can be confirmed.
   *
   * @param {object[]} links - Current local links array.
   * @returns {boolean} True when every active link has a non-blank URL.
   */
  static canConfirm(links) {
    return links.every((link) => link.delete || Boolean(link.url?.trim()));
  }
}
