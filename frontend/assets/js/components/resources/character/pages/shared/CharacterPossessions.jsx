import { useEffect, useMemo, useState } from 'react';
import CharacterPossessionsHelper from '../helpers/CharacterPossessionsHelper.jsx';
import CharacterPossessionsAccessController from '../controllers/CharacterPossessionsAccessController.js';
import CharacterContextController from '../controllers/CharacterContextController.js';
import ResourceExchangeModal from '../elements/ResourceExchangeModal.jsx';
import possessionExchangeTabs from '../elements/possessionExchangeTabs.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Builds the character context object passed to the possession exchange modal, threading through
 * the game-scoped ids plus both edit-permission flags the modal's two tabs each need
 * independently (issue #1076): `canEdit` (character-level, `CharacterEditPermission`-shaped —
 * routes the Remove tab through `possessions/remove/all.json`) and `gameCanEdit` (game-level,
 * `GameEditPermission`-only — routes the Acquire tab through `possessions/acquire/all.json`).
 * Mirrors `CharacterItems.jsx`'s own `buildItemExchangeCharacter` exactly.
 *
 * @param {string|number} characterId - Character id.
 * @param {string} gameSlug - Game slug the character belongs to.
 * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
 * @param {object|null} character - Currently loaded character context, or `null` while loading.
 * @returns {object} Character context for {@link ResourceExchangeModal}.
 */
export function buildPossessionExchangeCharacter(characterId, gameSlug, isPc, character) {
  return {
    id: characterId,
    game_slug: gameSlug,
    is_pc: isPc,
    canEdit: character?.can_edit,
    gameCanEdit: character?.game_can_edit,
  };
}

/**
 * Shared PC/NPC possessions index page component (issue #1076), resolving the character-level
 * `can_create_possession` permission (via `CharacterPossessionsAccessController`, independent of
 * `ListPage`'s own `can_edit`) and threading it into `CharacterPossessionsHelper` so both the
 * "Create Possession" button and the "Exchange Possessions" button are gated off that same
 * authoritative server-computed flag — it is exactly the same rule the acquire/remove endpoints
 * enforce. Mirrors `CharacterItems.jsx` exactly.
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {string} props.listType - `listTypeConfig` key for this character kind
 *   (`'pc-possessions'`/`'npc-possessions'`).
 * @param {boolean} props.isPc - Whether the character is a PC (vs. an NPC), passed through to
 *   the possession exchange modal.
 * @returns {React.ReactElement} Character possessions page element.
 */
export default function CharacterPossessions({ characterKind, listType, isPc }) {
  const [canCreatePossession, setCanCreatePossession] = useState(false);
  const [character, setCharacter] = useState(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    `/games/:game_slug/${characterKind}/:character_id/possessions`, currentHash, ['game_slug', 'character_id'],
  );

  const accessController = useMemo(
    () => new CharacterPossessionsAccessController(characterKind, setCanCreatePossession),
    [characterKind],
  );
  const contextController = useMemo(
    () => new CharacterContextController(characterKind, setCharacter, null, null, null, 'possessions'),
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
      {CharacterPossessionsHelper.render(
        characterKind, listType, gameSlug, characterId, canCreatePossession, refreshToken,
        () => setShowExchangeModal(true),
      )}
      <ResourceExchangeModal
        show={showExchangeModal}
        character={buildPossessionExchangeCharacter(characterId, gameSlug, isPc, character)}
        tabs={possessionExchangeTabs}
        defaultTab="acquire"
        onClose={() => setShowExchangeModal(false)}
        onSuccess={handleExchangeSuccess}
      />
    </>
  );
}
