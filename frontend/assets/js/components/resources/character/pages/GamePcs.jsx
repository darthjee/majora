import GamePcsHelper from './helpers/GamePcsHelper.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

const PATTERN = '/games/:game_slug/pcs';

/**
 * Game Player Characters index page.
 *
 * @returns {React.ReactElement} Game PCs page element.
 */
export default function GamePcs() {
  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam(PATTERN, 'game_slug', currentHash);

  return GamePcsHelper.render(gameSlug);
}
