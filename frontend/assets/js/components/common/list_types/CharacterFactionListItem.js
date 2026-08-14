import BaseListItem from './BaseListItem.js';

/**
 * List-item wrapper for a `CharacterFaction` entry (a `GameFaction` linked to a PC or NPC,
 * issue #943), adding the hidden flag list rendering needs beyond the base photo/display-text
 * accessors. `name`/`photo_path` on the raw entry are already fallback-resolved server-side
 * against the linked `GameFaction`, so, mirroring `CharacterDocumentListItem`, no client-side
 * fallback logic is needed here either.
 */
export default class CharacterFactionListItem extends BaseListItem {
  /**
   * Whether the character's enlistment in this faction is hidden from other players (DM/admin-
   * facing data only, present only in the `/all.json` variant).
   *
   * @returns {boolean} Hidden flag.
   */
  get hidden() {
    return Boolean(this.data.hidden);
  }
}
