import React from 'react';
import TooltipBadge from '../badges/TooltipBadge.jsx';
import Icons from '../../../utils/ui/Icons.js';

/**
 * Shared rendering helper for read-only item list entries (`GameItem`/`CharacterItem`),
 * used by `listTypeConfig`'s `items`/`pc-items`/`npc-items` entries. Unlike
 * `TreasureCardHelper`, items carry no quantity/availability concept, so the only
 * info-bar affordance is the Hidden badge.
 */
export default class ItemCardHelper {
  /**
   * Build an item's info-bar items: an optional Hidden badge, shown only when the item is
   * hidden (DM/admin-facing data only, present solely in the `/all.json` variants).
   *
   * @param {object} item - Item data object (`GameItem` or `CharacterItem` shape).
   * @param {boolean} [item.hidden] - Whether the item is hidden from players.
   * @param {string} hiddenLabel - Already-translated label for the Hidden badge.
   * @returns {{key: string, label: React.ReactElement}[]} Info-bar item definitions.
   */
  static buildInfoBarItems(item, hiddenLabel) {
    if (!item.hidden) {
      return [];
    }

    return [{
      key: 'hidden',
      label: (
        <TooltipBadge
          icon={Icons.eyeSlashFill}
          items={[{ icon: Icons.eyeSlashFill, text: hiddenLabel, variant: null }]}
        />
      ),
    }];
  }
}
