import { useEffect, useMemo, useState } from 'react';
import GameItemsHelper from './helpers/GameItemsHelper.jsx';
import GameItemsController from './controllers/GameItemsController.js';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game Items index page.
 *
 * @description Resolves `can_create_item` (issue #784) through {@link GameItemsController},
 *   rather than `ListPage`'s built-in `onCanEditChange`/`canEdit` — the latter reflects the plain
 *   `can_edit` permission (dm/admin only) and would wrongly hide the "Create Item" link from
 *   staff.
 * @returns {React.ReactElement} Game items page element.
 */
export default function GameItems() {
  const [canCreateItem, setCanCreateItem] = useState(false);

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam('/games/:game_slug/items', 'game_slug', currentHash);
  const basePath = `#/games/${gameSlug}/items`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/items/new`;

  const controller = useMemo(() => new GameItemsController(setCanCreateItem), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return GameItemsHelper.render({
    gameSlug, basePath, backHref, newHref, canCreateItem,
  });
}
