import GameDocumentsHelper from './helpers/GameDocumentsHelper.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game Documents index page.
 *
 * @returns {React.ReactElement} Game documents page element.
 */
export default function GameDocuments() {
  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam('/games/:game_slug/documents', 'game_slug', currentHash);
  const basePath = `#/games/${gameSlug}/documents`;
  const backHref = `#/games/${gameSlug}`;

  return GameDocumentsHelper.render({ gameSlug, basePath, backHref });
}
