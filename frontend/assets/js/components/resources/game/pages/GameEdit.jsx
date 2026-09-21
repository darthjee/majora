import { useEffect, useMemo, useState } from 'react';
import GameEditController from './controllers/GameEditController.js';
import GameEditHelper from './helpers/GameEditHelper.jsx';
import GameHelper from './helpers/GameHelper.jsx';
import GameEditModals from './elements/GameEditModals.jsx';
import getCurrentHash from '../../../../utils/routing/currentHash.js';
import useFormState from '../../../../utils/useFormState.js';
import useSyncGameFields from './hooks/useSyncGameFields.js';
import useGameEditModals from './hooks/useGameEditModals.js';

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
  const { state: fields, setField, handleChange } = useFormState({ name: '', description: '' });

  const controller = useMemo(
    () => new ControllerClass(setGame, setLoading, setError, setFieldErrors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const currentHash = getCurrentHash();
  const gameSlug = GameEditController.getGameSlugFromEditHash(currentHash);

  useEffect(() => controller.buildEffect()(), [controller]);

  useSyncGameFields(game, gameSlug, setField, setLinks);

  const { modalProps, onOpenUploadModal, onOpenLinksModal } = useGameEditModals(controller, setLinks);

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
          onOpenUploadModal,
          onOpenLinksModal,
        },
      )}
      <GameEditModals {...modalProps} gameSlug={gameSlug} links={links} />
    </>
  );
}
