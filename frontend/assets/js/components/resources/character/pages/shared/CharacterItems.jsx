import { useEffect, useMemo, useState } from 'react';
import CharacterItemsHelper from '../helpers/CharacterItemsHelper.jsx';
import CharacterItemsAccessController from '../controllers/CharacterItemsAccessController.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Shared PC/NPC items index page component (issue #714), resolving the character-level
 * `can_create_item` permission (via `CharacterItemsAccessController`, independent of `ListPage`'s
 * own `can_edit`) and threading it into `CharacterItemsHelper` so the "Create Item" button is
 * gated off an authoritative server-computed flag.
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {string} props.listType - `listTypeConfig` key for this character kind
 *   (`'pc-items'`/`'npc-items'`).
 * @returns {React.ReactElement} Character items page element.
 */
export default function CharacterItems({ characterKind, listType }) {
  const [canCreateItem, setCanCreateItem] = useState(false);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    `/games/:game_slug/${characterKind}/:character_id/items`, currentHash, ['game_slug', 'character_id'],
  );

  const controller = useMemo(
    () => new CharacterItemsAccessController(characterKind, setCanCreateItem),
    [characterKind],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  return CharacterItemsHelper.render(characterKind, listType, gameSlug, characterId, canCreateItem);
}
