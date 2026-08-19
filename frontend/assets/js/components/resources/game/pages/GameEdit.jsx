import { useEffect, useMemo, useState } from 'react';
import GameEditController from './controllers/GameEditController.js';
import GameEditHelper from './helpers/GameEditHelper.jsx';
import GameHelper from './helpers/GameHelper.jsx';
import GameEditModals from './elements/GameEditModals.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';

/**
 * Whether the current user may reach the game edit page (full editor, any player of the game, or
 * any Staff account), matching the same `canReachEditPage` shape already used by the character
 * edit page (issue #891).
 *
 * @param {object} game - Loaded game data object.
 * @param {boolean} [game.can_edit] - Whether the current user is a full (dm/admin) editor.
 * @param {boolean} [game.is_player] - Whether the current user is a player of the game.
 * @param {boolean} [game.is_staff] - Whether the current user is a Staff account.
 * @returns {boolean} Whether the edit page is reachable for this game/user pair.
 */
function canReachEditPage(game) {
  return Boolean(game.can_edit || game.is_player || game.is_staff);
}

/**
 * Game edit page.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Game edit controller class to instantiate, mainly
 *   for tests.
 * @returns {React.ReactElement} Game edit page element.
 */
export default function GameEdit({ ControllerClass = GameEditController }) {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [links, setLinks] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinksModal, setShowLinksModal] = useState(false);
  const { state: fields, setField, handleChange } = useFormState({ name: '', description: '' });

  const controller = useMemo(
    () => new ControllerClass(setGame, setLoading, setError, setFieldErrors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = getCurrentHash();
  const gameSlug = GameEditController.getGameSlugFromEditHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useEffect(() => {
    if (!game) return;

    if (!canReachEditPage(game)) {
      if (typeof window !== 'undefined') {
        window.location.hash = `/games/${gameSlug}`;
      }
      return;
    }

    setField('name', game.name ?? '');
    setField('description', game.description ?? '');
    setLinks(game.links ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    controller.buildEffect()();
  };

  const handleSubmit = (event) => controller.submitForm(
    event,
    gameSlug,
    { ...fields, links },
    { setStatus, setFieldErrors },
  );

  if (loading) return GameEditHelper.renderLoading();
  if (error) return GameHelper.renderError(error);

  return (
    <>
      {GameEditHelper.render(
        {
          isFullEditor: game?.can_edit,
          ...fields,
          photo_path: game?.photo_path,
          links,
          status,
          fieldErrors,
        },
        {
          onSubmit: handleSubmit,
          onNameChange: handleChange('name'),
          onDescriptionChange: handleChange('description'),
          onOpenUploadModal: () => setShowUploadModal(true),
          onOpenLinksModal: () => setShowLinksModal(true),
        },
      )}
      <GameEditModals
        showUploadModal={showUploadModal}
        showLinksModal={showLinksModal}
        gameSlug={gameSlug}
        links={links}
        onUploadClose={() => setShowUploadModal(false)}
        onUploadSuccess={handleUploadSuccess}
        onLinksClose={() => setShowLinksModal(false)}
        onLinksConfirm={(newLinks) => {
          setLinks(newLinks);
          setShowLinksModal(false);
        }}
      />
    </>
  );
}
