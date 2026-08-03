import { useEffect, useMemo, useState } from 'react';
import CharacterDocumentsHelper from '../helpers/CharacterDocumentsHelper.jsx';
import CharacterContextController from '../controllers/CharacterContextController.js';
import ResourceExchangeModal from '../elements/ResourceExchangeModal.jsx';
import documentExchangeTabs from '../elements/documentExchangeTabs.js';
import BasePageController from '../../../../common/base/controllers/BasePageController.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Builds the character context object passed to the document exchange modal, mirroring
 * `CharacterItems.jsx`'s own `buildItemExchangeCharacter` (issue #920): `canEdit`
 * (character-level, `CharacterEditPermission`-shaped — routes the Remove tab through
 * `documents/remove/all.json`) and `gameCanEdit` (game-level, `GameEditPermission`-only — routes
 * the Acquire tab through `documents/acquire/all.json`).
 *
 * @param {string|number} characterId - Character id.
 * @param {string} gameSlug - Game slug the character belongs to.
 * @param {boolean} isPc - Whether the character is a PC (vs. an NPC).
 * @param {object|null} character - Currently loaded character context, or `null` while loading.
 * @returns {object} Character context for {@link ResourceExchangeModal}.
 */
export function buildDocumentExchangeCharacter(characterId, gameSlug, isPc, character) {
  return {
    id: characterId,
    game_slug: gameSlug,
    is_pc: isPc,
    canEdit: character?.can_edit,
    gameCanEdit: character?.game_can_edit,
  };
}

/**
 * Shared PC/NPC documents index page component (issue #725), mirroring `shared/CharacterItems.jsx`.
 * Unlike items, documents have no create page/permission in scope, so there's no
 * create-permission resolution here — only the exchange trigger (issue #920), gated by the
 * game-level `gameCanEdit`/character-level `canEdit` context `CharacterContextController` already
 * resolves.
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {string} props.listType - `listTypeConfig` key for this character kind
 *   (`'pc-documents'`/`'npc-documents'`).
 * @param {boolean} props.isPc - Whether the character is a PC (vs. an NPC), passed through to
 *   the document exchange modal.
 * @returns {React.ReactElement} Character documents page element.
 */
export default function CharacterDocuments({ characterKind, listType, isPc }) {
  const [character, setCharacter] = useState(null);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug, character_id: characterId } = BasePageController.extractParams(
    `/games/:game_slug/${characterKind}/:character_id/documents`, currentHash, ['game_slug', 'character_id'],
  );

  const contextController = useMemo(
    () => new CharacterContextController(characterKind, setCharacter, null, null, null, 'documents'),
    [characterKind],
  );

  useEffect(() => contextController.buildEffect()(), [contextController]);
  FacadeRefresh.useFacadeRefresh(contextController);

  const refresh = () => setRefreshToken((token) => token + 1);

  const handleExchangeSuccess = () => {
    contextController.refreshCharacter();
    refresh();
  };

  return (
    <>
      {CharacterDocumentsHelper.render(
        characterKind, listType, gameSlug, characterId, refreshToken, () => setShowExchangeModal(true),
      )}
      <ResourceExchangeModal
        show={showExchangeModal}
        character={buildDocumentExchangeCharacter(characterId, gameSlug, isPc, character)}
        tabs={documentExchangeTabs}
        defaultTab="acquire"
        onClose={() => setShowExchangeModal(false)}
        onSuccess={handleExchangeSuccess}
      />
    </>
  );
}
