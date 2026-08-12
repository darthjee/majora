import { useEffect, useMemo, useState } from 'react';
import GamePossessionsHelper from './helpers/GamePossessionsHelper.jsx';
import GamePossessionsController from './controllers/GamePossessionsController.js';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game Possessions index page (issue #1074), mirroring `GameItems`.
 *
 * @description Resolves `can_create_possession` through {@link GamePossessionsController},
 *   rather than `ListPage`'s built-in `onCanEditChange`/`canEdit` — the latter reflects the plain
 *   `can_edit` permission (dm/admin only) and would wrongly hide the "Create Possession" link
 *   from staff/players.
 * @returns {React.ReactElement} Game possessions page element.
 */
export default function GamePossessions() {
  const [canCreatePossession, setCanCreatePossession] = useState(false);

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam('/games/:game_slug/possessions', 'game_slug', currentHash);
  const basePath = `#/games/${gameSlug}/possessions`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/possessions/new`;

  const controller = useMemo(() => new GamePossessionsController(setCanCreatePossession), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  return GamePossessionsHelper.render({
    gameSlug, basePath, backHref, newHref, canCreatePossession,
  });
}
