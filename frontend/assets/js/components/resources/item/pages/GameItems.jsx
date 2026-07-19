import GameItemsHelper from './helpers/GameItemsHelper.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game Items index page.
 *
 * @returns {React.ReactElement} Game items page element.
 */
export default function GameItems() {
  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam('/games/:game_slug/items', 'game_slug', currentHash);
  const basePath = `#/games/${gameSlug}/items`;
  const backHref = `#/games/${gameSlug}`;

  return GameItemsHelper.render({ gameSlug, basePath, backHref });
}
