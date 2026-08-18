import { useEffect, useMemo, useState } from 'react';
import GameCommonItemsHelper from './helpers/GameCommonItemsHelper.jsx';
import GameCommonItemsController from './controllers/GameCommonItemsController.js';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game Common Items index page (issue #826), mirroring `GamePossessions`.
 *
 * @description Resolves `can_create_common_item` through {@link GameCommonItemsController},
 *   rather than `ListPage`'s built-in `onCanEditChange`/`canEdit` — the latter reflects the plain
 *   `can_edit` permission (dm/admin only) and would wrongly hide the "Create Common Item" link
 *   from staff/players.
 * @returns {React.ReactElement} Game common items page element.
 */
export default function GameCommonItems() {
  const [canCreateCommonItem, setCanCreateCommonItem] = useState(false);

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam('/games/:game_slug/common_items', 'game_slug', currentHash);
  const basePath = `#/games/${gameSlug}/common_items`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/common_items/new`;

  const controller = useMemo(() => new GameCommonItemsController(setCanCreateCommonItem), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return GameCommonItemsHelper.render({
    gameSlug, basePath, backHref, newHref, canCreateCommonItem,
  });
}
