import { useEffect, useMemo, useState } from 'react';
import GameTreasureController from './controllers/GameTreasureController.js';
import GameTreasureHelper from './helpers/GameTreasureHelper.jsx';
import GiveTreasureModal from './elements/GiveTreasureModal.jsx';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game-scoped treasure detail page (issue #1001): loads a single game-scoped `Treasure` (via
 * {@link GameTreasureController}) and delegates rendering to {@link GameTreasureHelper}. Also
 * renders the give-treasure modal, gated on the controller's independently-derived
 * `canUploadPhoto` flag (issue #1005 — superuser/staff/dm/player of the game, fixing the "Give
 * Treasure" button's previously-unconditional visibility); every per-character grant is still
 * checked server-side by the reused acquire endpoint. The modal itself is routed through the
 * controller's independently-derived `canGiveHidden` flag (superuser/dm/staff, issue #833) so a
 * hidden treasure can only be given through the elevated acquire endpoint, replacing the previous,
 * too-broad `treasure?.can_edit`-driven derivation. No forced page refetch on the modal's own
 * success/close, since this page displays nothing summary-derived.
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
  const [canUploadPhoto, setCanUploadPhoto] = useState(false);
  const [canGiveHidden, setCanGiveHidden] = useState(false);
  const [showGiveTreasureModal, setShowGiveTreasureModal] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(setTreasure, setLoading, setError, setCanUploadPhoto, setCanGiveHidden),
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
        treasure, backHref, editHref, () => setShowGiveTreasureModal(true), canUploadPhoto,
      )}
      <GiveTreasureModal
        show={showGiveTreasureModal}
        treasure={treasure ?? {}}
        gameSlug={gameSlug}
        canGiveHidden={canGiveHidden}
        onClose={() => setShowGiveTreasureModal(false)}
      />
    </>
  );
}
