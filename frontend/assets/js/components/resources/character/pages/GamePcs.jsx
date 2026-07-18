import GamePcsHelper from './helpers/GamePcsHelper.jsx';
import BasePageController from '../../../common/controllers/BasePageController.js';

const PATTERN = '/games/:game_slug/pcs';

/**
 * Game Player Characters index page.
 *
 * @returns {React.ReactElement} Game PCs page element.
 */
export default function GamePcs() {
  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const gameSlug = BasePageController.extractParam(PATTERN, 'game_slug', currentHash);

  return GamePcsHelper.render(gameSlug);
}
