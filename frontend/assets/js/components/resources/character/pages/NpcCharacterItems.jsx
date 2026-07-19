import CharacterItemsHelper from './helpers/CharacterItemsHelper.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

const PATTERN = '/games/:game_slug/npcs/:character_id/items';

/**
 * NPC Items index page.
 *
 * @returns {React.ReactElement} NPC items page element.
 */
export default function NpcCharacterItems() {
  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    PATTERN, currentHash, ['game_slug', 'character_id'],
  );

  return CharacterItemsHelper.render('npcs', 'npc-items', gameSlug, characterId);
}
