import { useEffect, useMemo, useState } from 'react';
import GameNpcsController from './controllers/GameNpcsController.js';
import GameCharactersHelper from './helpers/GameCharactersHelper.jsx';
import Translator from '../../../../i18n/Translator.js';
import AuthStorage from '../../../../utils/AuthStorage.js';
import HashRouteResolver from '../../../../utils/HashRouteResolver.js';
import PhotoUploadModal from '../../../common/PhotoUploadModal.jsx';
import SlainConfirmModal from './elements/SlainConfirmModal.jsx';
import SlainConfirmController from './elements/controllers/SlainConfirmController.js';
import PlayerSlainConfirmController from './elements/controllers/PlayerSlainConfirmController.js';
import NpcFilters from './elements/NpcFilters.jsx';

/**
 * Builds a slain-toggle controller/state pair for the given field, refreshing
 * the NPC list and clearing the target once the request succeeds.
 *
 * @param {'slain'|'public_slain'} field - Character field this pair toggles.
 * @param {import('./controllers/GameNpcsController.js').default} controller - List controller,
 *   whose effect is re-run to refresh the NPC list after toggling.
 * @returns {{target: object|null, setTarget: Function, slainController: SlainConfirmController}} Slain
 *   toggle state and controller pair.
 */
function useSlainTogglePair(field, controller) {
  const [target, setTarget] = useState(null);

  const slainController = useMemo(
    () => new SlainConfirmController(() => {
      setTarget(null);
      controller.buildEffect()();
    }, field),
    [controller, field],
  );

  return { target, setTarget, slainController };
}

/**
 * Builds the target state and controller pair for the player-facing slain
 * toggle, which PATCHes the plain NPC endpoint as a player of the game
 * (rather than the DM's `full.json` endpoint used by {@link useSlainTogglePair}).
 *
 * @param {import('./controllers/GameNpcsController.js').default} controller - List controller,
 *   whose effect is re-run to refresh the NPC list after toggling.
 * @returns {{target: object|null, setTarget: Function, playerSlainController:
 *   PlayerSlainConfirmController}} Player-facing slain toggle state and controller pair.
 */
function usePlayerSlainTogglePair(controller) {
  const [target, setTarget] = useState(null);

  const playerSlainController = useMemo(
    () => new PlayerSlainConfirmController(() => {
      setTarget(null);
      controller.buildEffect()();
    }),
    [controller],
  );

  return { target, setTarget, playerSlainController };
}

/**
 * Game Non-Player Characters index page.
 *
 * @returns {React.ReactElement} Game NPCs page element.
 */
export default function GameNpcs() {
  const [npcs, setNpcs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, perPage: 10 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [isPlayer, setIsPlayer] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);

  const controller = useMemo(
    () => new GameNpcsController(
      setNpcs, setPagination, setLoading, setError, null, null, setCanEdit, setIsPlayer,
    ),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);

  const slain = useSlainTogglePair('slain', controller);
  const publicSlain = useSlainTogglePair('public_slain', controller);
  const playerSlain = usePlayerSlainTogglePair(controller);

  const gameSlug = GameNpcsController.getGameSlugFromNpcsHash(window.location.hash);
  const basePath = `#/games/${gameSlug}/npcs`;
  const backHref = `#/games/${gameSlug}`;
  const newHref = `#/games/${gameSlug}/npcs/new`;
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const handleUploadSuccess = () => {
    setUploadTarget(null);
    controller.buildEffect()();
  };

  const handleFilterQuery = (filters) => {
    window.location.hash = GameNpcsController.buildFilterQueryHash(basePath, filters);
    controller.buildEffect()();
  };

  const handleFilterClear = () => {
    window.location.hash = basePath;
    controller.buildEffect()();
  };

  if (loading) return GameCharactersHelper.renderLoading();
  if (error) return GameCharactersHelper.renderError(error);

  return (
    <>
      {GameCharactersHelper.render(
        npcs, pagination, basePath, gameSlug, Translator.t('game_npcs_page.title'), 'npc', backHref,
        canEdit, newHref, setUploadTarget, slain.setTarget, publicSlain.setTarget, activeFilters,
        <NpcFilters onQuery={handleFilterQuery} onClear={handleFilterClear} />,
        isPlayer, playerSlain.setTarget,
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
