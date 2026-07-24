import { useEffect, useMemo, useState } from 'react';
import CharacterItemsHelper from '../helpers/CharacterItemsHelper.jsx';
import CharacterItemsAccessController from '../controllers/CharacterItemsAccessController.js';
import CharacterContextController from '../controllers/CharacterContextController.js';
import ResourceExchangeModal from '../elements/ResourceExchangeModal.jsx';
import itemExchangeTabs from '../elements/itemExchangeTabs.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Builds the character context object passed to the item exchange modal, threading through the
 * game-scoped ids plus both edit-permission flags the modal's two tabs each need independently
 * (issue #773): `canEdit` (character-level, `CharacterEditPermission`-shaped — routes the Remove
 * tab through `items/remove/all.json`) and `gameCanEdit` (game-level, `GameEditPermission`-only
 * — routes the Acquire tab through `items/acquire/all.json`). Unlike the treasure exchange
 * modal's `buildExchangeCharacter` (which only ever needed the game-level flag, since every
 * treasure `/all.json` variant is game-level-gated), items need both scopes at once because the
 * two actions are gated differently on the backend.
 *
 * @param {string|number} characterId - Character id.
 * @param {string} gameSlug - Game slug the character belongs to.
 * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
 * @param {object|null} character - Currently loaded character context, or `null` while loading.
 * @returns {object} Character context for {@link ResourceExchangeModal}.
 */
export function buildItemExchangeCharacter(characterId, gameSlug, isPc, character) {
  return {
    id: characterId,
    game_slug: gameSlug,
    is_pc: isPc,
    canEdit: character?.can_edit,
    gameCanEdit: character?.game_can_edit,
  };
}

/**
 * Shared PC/NPC items index page component (issue #714), resolving the character-level
 * `can_create_item` permission (via `CharacterItemsAccessController`, independent of `ListPage`'s
 * own `can_edit`) and threading it into `CharacterItemsHelper` so both the "Create Item" button
 * and the new "Exchange Items" button (issue #773) are gated off that same authoritative
 * server-computed flag — it is exactly the same rule the acquire/remove endpoints enforce.
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {string} props.listType - `listTypeConfig` key for this character kind
 *   (`'pc-items'`/`'npc-items'`).
 * @param {boolean} props.isPc - Whether the character is a PC (vs. an NPC), passed through to
 *   the item exchange modal.
 * @returns {React.ReactElement} Character items page element.
 */
export default function CharacterItems({ characterKind, listType, isPc }) {
  const [canCreateItem, setCanCreateItem] = useState(false);
  const [character, setCharacter] = useState(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    `/games/:game_slug/${characterKind}/:character_id/items`, currentHash, ['game_slug', 'character_id'],
  );

  const accessController = useMemo(
    () => new CharacterItemsAccessController(characterKind, setCanCreateItem),
    [characterKind],
  );
  const contextController = useMemo(
    () => new CharacterContextController(characterKind, setCharacter, null, null, null, 'items'),
    [characterKind],
  );

  useEffect(() => accessController.buildEffect()(), [accessController]);
  useEffect(() => contextController.buildEffect()(), [contextController]);
  FacadeRefresh.useFacadeRefresh(accessController);
  FacadeRefresh.useFacadeRefresh(contextController);

  const refresh = () => setRefreshToken((token) => token + 1);

  const handleExchangeSuccess = () => {
    contextController.refreshCharacter();
    refresh();
  };

  return (
    <>
      {CharacterItemsHelper.render(
        characterKind, listType, gameSlug, characterId, canCreateItem, refreshToken,
        () => setShowExchangeModal(true),
      )}
      <ResourceExchangeModal
        show={showExchangeModal}
        character={buildItemExchangeCharacter(characterId, gameSlug, isPc, character)}
        tabs={itemExchangeTabs}
        defaultTab="acquire"
        onClose={() => setShowExchangeModal(false)}
        onSuccess={handleExchangeSuccess}
      />
    </>
  );
}
