import CharacterItemsHelper from './helpers/CharacterItemsHelper.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

const PATTERN = '/games/:game_slug/pcs/:character_id/items';

/**
 * PC Items index page.
 *
 * @returns {React.ReactElement} PC items page element.
 */
export default function PcCharacterItems() {
  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    PATTERN, currentHash, ['game_slug', 'character_id'],
  );

  return CharacterItemsHelper.render('pcs', 'pc-items', gameSlug, characterId);
}
