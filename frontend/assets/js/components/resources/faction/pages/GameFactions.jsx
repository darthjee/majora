import { useEffect, useMemo, useState } from 'react';
import GameFactionsHelper from './helpers/GameFactionsHelper.jsx';
import GameFactionsController from './controllers/GameFactionsController.js';
import FactionNewModal from './elements/FactionNewModal.jsx';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

const PATTERN = '/games/:game_slug/factions';

/**
 * Game Factions index page (issue #812), mirroring `GameItems.jsx`/`Sources.jsx`: resolves
 * `can_create_faction` (via {@link GameFactionsController}, independent of `ListPage`'s built-in
 * `canEdit`) so the page can conditionally render the "Create Faction" action, and owns the
 * "New Faction" modal's open/closed state and a `refreshToken` counter — a successful creation
 * closes the modal and bumps the token, which `ListPage` reads to re-fetch the list without a
 * full page navigation. No `/new` route/page — creation only happens via this modal, matching
 * `Source` rather than `GamePossession`/`GameItem`. No filter bar, mirroring `GameItems`.
 *
 * @returns {React.ReactElement} Game factions page element.
 */
export default function GameFactions() {
  const [canCreateFaction, setCanCreateFaction] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam(PATTERN, 'game_slug', currentHash);
  const basePath = `#/games/${gameSlug}/factions`;
  const backHref = `#/games/${gameSlug}`;

  const controller = useMemo(() => new GameFactionsController(setCanCreateFaction), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSuccess = () => {
    setShowNewModal(false);
    setRefreshToken((token) => token + 1);
  };

  return (
    <>
      {GameFactionsHelper.render(
        {
          gameSlug, basePath, backHref, canCreateFaction, refreshToken,
        },
        {
          onNewClick: () => setShowNewModal(true),
        },
      )}
      <FactionNewModal
        show={showNewModal}
        gameSlug={gameSlug}
        onClose={() => setShowNewModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
