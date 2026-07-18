import GamePlayersHelper from './helpers/GamePlayersHelper.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';

const PATTERN = '/games/:game_slug/players';

/**
 * Game Players roster index page.
 *
 * @returns {React.ReactElement} Game players page element.
 */
export default function GamePlayers() {
  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const gameSlug = BasePageController.extractParam(PATTERN, 'game_slug', currentHash);

  return GamePlayersHelper.render(gameSlug);
}
