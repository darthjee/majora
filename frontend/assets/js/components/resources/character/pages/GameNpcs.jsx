import { useEffect, useMemo, useState } from 'react';
import GameCharactersHelper from './helpers/GameCharactersHelper.jsx';
import GameNpcsAccessController from './controllers/GameNpcsAccessController.js';
import BasePageController from '../../../common/controllers/BasePageController.js';
import AuthStorage from '../../../../utils/auth/AuthStorage.js';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';
import PhotoUploadModal from '../../../common/PhotoUploadModal.jsx';
import SlainConfirmModal from './elements/SlainConfirmModal.jsx';
import SlainConfirmController from './elements/controllers/SlainConfirmController.js';
import PlayerSlainConfirmController from './elements/controllers/PlayerSlainConfirmController.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';

const PATTERN = '/games/:game_slug/npcs';

/**
 * Build the hash URL for applying NPC filters, resetting pagination to page 1.
 *
 * @param {string} basePath - Base hash path (e.g. `#/games/demo/npcs`).
 * @param {{slain?: string, name?: string, allegiance?: string, hidden?: string}} filters -
 *   Filters to apply, as built by `NpcFiltersController#buildQuery` (blank fields already
 *   omitted).
 * @returns {string} Hash including the reset page and the active filters.
 */
function buildFilterQueryHash(basePath, filters) {
  const params = new URLSearchParams({ page: '1', ...filters });
  return `${basePath}?${params.toString()}`;
}

/**
 * Builds a slain-toggle controller/state pair for the given field, refreshing the NPC list and
 * clearing the target once the request succeeds.
 *
 * @param {'slain'|'public_slain'} field - Character field this pair toggles.
 * @param {Function} refresh - Called to re-trigger the NPC list fetch after toggling.
 * @returns {{target: object|null, setTarget: Function, slainController: SlainConfirmController}} Slain
 *   toggle state and controller pair.
 */
function useSlainTogglePair(field, refresh) {
  const [target, setTarget] = useState(null);

  const slainController = useMemo(
    () => new SlainConfirmController(() => {
      setTarget(null);
      refresh();
    }, field),
    [refresh, field],
  );

  return { target, setTarget, slainController };
}

/**
 * Builds the target state and controller pair for the player-facing slain toggle, which
 * PATCHes the plain NPC endpoint as a player of the game (rather than the DM's `full.json`
 * endpoint used by {@link useSlainTogglePair}).
 *
 * @param {Function} refresh - Called to re-trigger the NPC list fetch after toggling.
 * @returns {{target: object|null, setTarget: Function, playerSlainController:
 *   PlayerSlainConfirmController}} Player-facing slain toggle state and controller pair.
 */
function usePlayerSlainTogglePair(refresh) {
  const [target, setTarget] = useState(null);

  const playerSlainController = useMemo(
    () => new PlayerSlainConfirmController(() => {
      setTarget(null);
      refresh();
    }),
    [refresh],
  );

  return { target, setTarget, playerSlainController };
}

/**
 * Game Non-Player Characters index page.
 *
 * @returns {React.ReactElement} Game NPCs page element.
 */
export default function GameNpcs() {
  const [canEdit, setCanEdit] = useState(false);
  const [isPlayer, setIsPlayer] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const currentHash = typeof window === 'undefined' ? '' : window.location.hash;
  const gameSlug = BasePageController.extractParam(PATTERN, 'game_slug', currentHash);
  const basePath = `#/games/${gameSlug}/npcs`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/npcs/new`;
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const refresh = () => setRefreshToken((token) => token + 1);

  const accessController = useMemo(
    () => new GameNpcsAccessController(gameSlug, setIsPlayer),
    [gameSlug],
  );

  useEffect(() => accessController.buildEffect()(), [accessController]);
  FacadeRefresh.useFacadeRefresh(accessController);

  const slain = useSlainTogglePair('slain', refresh);
  const publicSlain = useSlainTogglePair('public_slain', refresh);
  const playerSlain = usePlayerSlainTogglePair(refresh);

  const handleUploadSuccess = () => {
    setUploadTarget(null);
    refresh();
  };

  const handleFilterQuery = (filters) => {
    window.location.hash = buildFilterQueryHash(basePath, filters);
    refresh();
  };

  const handleFilterClear = () => {
    window.location.hash = basePath;
    refresh();
  };

  return (
    <>
      {GameCharactersHelper.render(
        {
          gameSlug, basePath, backHref, newHref, canEdit, isPlayer, refreshToken, activeFilters,
        },
        {
          onCanEditChange: setCanEdit,
          onUploadClick: setUploadTarget,
          onSlainClick: slain.setTarget,
          onPublicSlainClick: publicSlain.setTarget,
          onPlayerSlainClick: playerSlain.setTarget,
          onFilterQuery: handleFilterQuery,
          onFilterClear: handleFilterClear,
        },
      )}
      <PhotoUploadModal
        show={uploadTarget !== null}
        uploadPath={`/games/${gameSlug}/npcs/${uploadTarget?.id}/photo_upload.json`}
        onClose={() => setUploadTarget(null)}
        onSuccess={handleUploadSuccess}
      />
      <SlainConfirmModal
        show={slain.target !== null}
        slain={slain.target?.slain}
        onCancel={() => slain.setTarget(null)}
        onConfirm={() => slain.slainController.handleConfirm(gameSlug, slain.target, AuthStorage.getToken())}
      />
      <SlainConfirmModal
        show={publicSlain.target !== null}
        slain={publicSlain.target?.public_slain}
        isPublic
        onCancel={() => publicSlain.setTarget(null)}
        onConfirm={() => publicSlain.slainController.handleConfirm(
          gameSlug, publicSlain.target, AuthStorage.getToken(),
        )}
      />
      <SlainConfirmModal
        show={playerSlain.target !== null}
        slain={playerSlain.target?.slain}
        onCancel={() => playerSlain.setTarget(null)}
        onConfirm={() => playerSlain.playerSlainController.handleConfirm(
          gameSlug, playerSlain.target, AuthStorage.getToken(),
        )}
      />
    </>
  );
}
