import CharacterDocumentsHelper from '../helpers/CharacterDocumentsHelper.jsx';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Shared PC/NPC documents index page component (issue #725), mirroring `shared/CharacterItems.jsx`.
 * Unlike items, documents have no create page in scope, so there's no create-permission
 * resolution here.
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {string} props.listType - `listTypeConfig` key for this character kind
 *   (`'pc-documents'`/`'npc-documents'`).
 * @returns {React.ReactElement} Character documents page element.
 */
export default function CharacterDocuments({ characterKind, listType }) {
  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    `/games/:game_slug/${characterKind}/:character_id/documents`, currentHash, ['game_slug', 'character_id'],
  );

  return CharacterDocumentsHelper.render(characterKind, listType, gameSlug, characterId);
}
