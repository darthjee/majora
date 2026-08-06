import { useEffect, useMemo, useState } from 'react';
import GameTreasureController from './controllers/GameTreasureController.js';
import GameTreasureHelper from './helpers/GameTreasureHelper.jsx';
import GiveTreasureModal from './elements/GiveTreasureModal.jsx';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game-scoped treasure detail page (issue #1001): loads a single game-scoped `Treasure` (via
 * {@link GameTreasureController}) and delegates rendering to {@link GameTreasureHelper}. Also
 * renders the give-treasure modal, unconditionally offered (no permission gate — every
 * per-character grant is checked server-side by the reused acquire endpoint instead); no forced
 * page refetch on its own success/close, since this page displays nothing summary-derived.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Treasure controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Game treasure detail page element.
 */
export default function GameTreasure({ ControllerClass = GameTreasureController }) {
  const [treasure, setTreasure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGiveTreasureModal, setShowGiveTreasureModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(setTreasure, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const currentHash = getCurrentHash();
  const { game_slug: gameSlug } = GameTreasureController.getParamsFromHash(currentHash);
  const backHref = `#/games/${gameSlug}/treasures`;

  if (loading) return GameTreasureHelper.renderLoading();
  if (error) return GameTreasureHelper.renderError(error);

  const editHref = `#/games/${gameSlug}/treasures/${treasure?.id}/edit`;

  return (
    <>
      {GameTreasureHelper.render(
        treasure, backHref, editHref, () => setShowGiveTreasureModal(true),
      )}
      <GiveTreasureModal
        show={showGiveTreasureModal}
        treasure={treasure ?? {}}
        gameSlug={gameSlug}
        canEdit={Boolean(treasure?.can_edit)}
        onClose={() => setShowGiveTreasureModal(false)}
      />
    </>
  );
}
