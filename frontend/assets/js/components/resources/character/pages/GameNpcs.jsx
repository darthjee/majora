import { useEffect, useMemo, useState } from 'react';
import GameCharactersHelper from './helpers/GameCharactersHelper.jsx';
import GameNpcsAccessController from './controllers/GameNpcsAccessController.js';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import AuthStorage from '../../../../utils/auth/AuthStorage.js';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';
import PhotoUploadModal from '../../../common/modals/PhotoUploadModal.jsx';
import SlainConfirmModal from './elements/SlainConfirmModal.jsx';
import SlainConfirmController from './elements/controllers/SlainConfirmController.js';
import PlayerSlainConfirmController from './elements/controllers/PlayerSlainConfirmController.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import resourceConfig from '../../../../utils/requests/resourceConfig.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFilterHandlers from './shared/hooks/useFilterHandlers.js';

const PATTERN = '/games/:game_slug/npcs';

/**
 * Builds a slain-toggle controller/state pair for the given field, refreshing the NPC list and
 * clearing the target once the request succeeds.
 *
 * @param {'private_slain'|'public_slain'} field - Character field this pair toggles.
 * @param {Function} refresh - Called to re-trigger the NPC list fetch after toggling.
 * @returns {{target: object|null, setTarget: Function, slainController: SlainConfirmController}} Slain
 *   toggle state and controller pair.
 */
function useSlainTogglePair(field, refresh) {
  const [target, setTarget] = useState(null);
  const handleToggled = () => {
    setTarget(null);
    refresh();
  };

  const slainController = useMemo(
    () => new SlainConfirmController(handleToggled, field),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const handleToggled = () => {
    setTarget(null);
    refresh();
  };

  const playerSlainController = useMemo(
    () => new PlayerSlainConfirmController(handleToggled),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refresh],
  );

  return { target, setTarget, playerSlainController };
}

/**
 * Private hook bundling the NPC list photo-upload modal's `uploadTarget` state together with
 * its success handler and its own `PhotoUploadModal` element, deriving the upload path from
 * `resourceConfig` for the current target — kept local, rather than promoted to a shared hook,
 * since `GameNpcNew.jsx`'s deferred-upload variant derives its path differently.
 *
 * @param {string} gameSlug - Game slug the NPCs belong to.
 * @param {Function} refresh - Called to re-trigger the NPC list fetch after a successful upload.
 * @returns {{uploadTarget: object|null, setUploadTarget: Function, modal: React.ReactElement}}
 *   `uploadTarget`/`setUploadTarget` — the NPC currently targeted by the upload modal, or
 *   `null`; `modal` — the `PhotoUploadModal` element, already wired to this state.
 */
function useNpcUploadModal(gameSlug, refresh) {
  const [uploadTarget, setUploadTarget] = useState(null);

  const handleUploadSuccess = () => {
    setUploadTarget(null);
    refresh();
  };

  const modal = (
    <PhotoUploadModal
      show={uploadTarget !== null}
      uploadPath={resourceConfig.get('POST', 'npc', 'single').regular.path({ gameSlug, id: uploadTarget?.id })}
      onClose={() => setUploadTarget(null)}
      onSuccess={handleUploadSuccess}
    />
  );

  return { uploadTarget, setUploadTarget, modal };
}

/**
 * Private hook bundling the NPC list's DM/player access state (`canEdit`/`isPlayer`/
 * `canCreateNpc`) together with the access controller wiring (initial-load effect and facade
 * refresh subscription).
 *
 * @param {string} gameSlug - Game slug the NPCs belong to.
 * @returns {{canEdit: boolean, setCanEdit: Function, isPlayer: boolean, canCreateNpc: boolean}}
 *   Access state, with `setCanEdit` exposed for `GameCharactersHelper`'s own detection.
 */
function useGameNpcsAccess(gameSlug) {
  const [canEdit, setCanEdit] = useState(false);
  const [isPlayer, setIsPlayer] = useState(false);
  const [canCreateNpc, setCanCreateNpc] = useState(false);

  const accessController = useMemo(
    () => new GameNpcsAccessController(gameSlug, setIsPlayer, setCanCreateNpc),
    [gameSlug],
  );

  useEffect(() => accessController.buildEffect()(), [accessController]);
  FacadeRefresh.useFacadeRefresh(accessController);

  return {
    canEdit, setCanEdit, isPlayer, canCreateNpc,
  };
}

/**
 * Builds the handlers object passed into {@link GameCharactersHelper#render}.
 *
 * @param {object} params - Handler-building params.
 * @param {Function} params.setCanEdit - `useGameNpcsAccess()`'s `setCanEdit` setter.
 * @param {object} params.uploadModal - `useNpcUploadModal()` result.
 * @param {object} params.slain - `useSlainTogglePair('private_slain', refresh)` result.
 * @param {object} params.publicSlain - `useSlainTogglePair('public_slain', refresh)` result.
 * @param {object} params.playerSlain - `usePlayerSlainTogglePair(refresh)` result.
 * @param {Function} params.onFilterQuery - `useFilterHandlers()`'s `onFilterQuery`.
 * @param {Function} params.onFilterClear - `useFilterHandlers()`'s `onFilterClear`.
 * @returns {object} Handlers object for `GameCharactersHelper.render`.
 */
function buildGameNpcsHandlers({
  setCanEdit, uploadModal, slain, publicSlain, playerSlain, onFilterQuery, onFilterClear,
}) {
  return {
    onCanEditChange: setCanEdit,
    onUploadClick: uploadModal.setUploadTarget,
    onSlainClick: slain.setTarget,
    onPublicSlainClick: publicSlain.setTarget,
    onPlayerSlainClick: playerSlain.setTarget,
    onFilterQuery,
    onFilterClear,
  };
}

/**
 * Renders the three slain-confirmation modals (private, public, and player-facing) for
 * {@link GameNpcs}.
 *
 * @param {object} props - Component props.
 * @param {object} props.slain - `useSlainTogglePair('private_slain', refresh)` result.
 * @param {object} props.publicSlain - `useSlainTogglePair('public_slain', refresh)` result.
 * @param {object} props.playerSlain - `usePlayerSlainTogglePair(refresh)` result.
 * @param {string} props.gameSlug - Game slug the NPCs belong to.
 * @returns {React.ReactElement} The three slain-confirmation modals.
 */
function NpcSlainModals({
  slain, publicSlain, playerSlain, gameSlug,
}) {
  return (
    <>
      <SlainConfirmModal
        show={slain.target !== null}
        slain={slain.target?.private_slain}
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
        slain={playerSlain.target?.public_slain}
        onCancel={() => playerSlain.setTarget(null)}
        onConfirm={() => playerSlain.playerSlainController.handleConfirm(
          gameSlug, playerSlain.target, AuthStorage.getToken(),
        )}
      />
    </>
  );
}

/**
 * Game Non-Player Characters index page.
 *
 * @returns {React.ReactElement} Game NPCs page element.
 */
export default function GameNpcs() {
  const [refreshToken, setRefreshToken] = useState(0);

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam(PATTERN, 'game_slug', currentHash);
  const basePath = `#/games/${gameSlug}/npcs`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/npcs/new`;
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const refresh = () => setRefreshToken((token) => token + 1);

  const {
    canEdit, setCanEdit, isPlayer, canCreateNpc,
  } = useGameNpcsAccess(gameSlug);
  const slain = useSlainTogglePair('private_slain', refresh);
  const publicSlain = useSlainTogglePair('public_slain', refresh);
  const playerSlain = usePlayerSlainTogglePair(refresh);
  const uploadModal = useNpcUploadModal(gameSlug, refresh);
  const { onFilterQuery, onFilterClear } = useFilterHandlers(basePath, refresh);

  const handlers = buildGameNpcsHandlers({
    setCanEdit, uploadModal, slain, publicSlain, playerSlain, onFilterQuery, onFilterClear,
  });

  return (
    <>
      {GameCharactersHelper.render(
        {
          gameSlug,
          basePath,
          backHref,
          newHref,
          canEdit,
          canCreateNpc,
          isPlayer,
          refreshToken,
          activeFilters,
        },
        handlers,
      )}
      {uploadModal.modal}
      <NpcSlainModals
        slain={slain}
        publicSlain={publicSlain}
        playerSlain={playerSlain}
        gameSlug={gameSlug}
      />
    </>
  );
}
