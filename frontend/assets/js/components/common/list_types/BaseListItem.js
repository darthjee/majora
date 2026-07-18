/**
 * Base wrapper class normalizing a raw list-page API entry into the shape
 * shared list rendering (`ListPageHelper`) needs, extended per entity type
 * (e.g. `TreasureListItem`) to add or override entity-specific accessors —
 * mirroring the existing `BaseCharacterTreasuresController` ->
 * `PcCharacterTreasuresController`/`NpcCharacterTreasuresController` precedent.
 */
export default class BaseListItem {
  /**
   * Wrap a raw list entry.
   *
   * @param {object} data - Raw API list entry.
   */
  constructor(data) {
    this.data = data;
  }

  /**
   * Photo/avatar URL for this item, or null when the raw entry has none.
   *
   * @returns {string|null} Photo URL.
   */
  get photoUrl() {
    return this.data.photo_path ?? null;
  }

  /**
   * Display text shown as this item's caption. Defaults to the raw entry's
   * `name` field.
   *
   * @returns {string} Display text.
   */
  get displayText() {
    return this.data.name;
  }

  /**
   * Optional secondary display text shown below the caption (e.g. a
   * formatted value). `null` when the entity type has none.
   *
   * @returns {string|null} Secondary display text, or null.
   */
  get formattedValue() {
    return null;
  }

  /**
   * Optional availability line text (e.g. "Available: X / Y" for capped
   * treasures) shown below the caption, alongside `formattedValue`. `null`
   * when the entity type has none.
   *
   * @returns {string|null} Availability text, or null.
   */
  get availabilityText() {
    return null;
  }
}
