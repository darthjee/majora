import { useEffect, useMemo, useState } from 'react';
import GameRecipeNewController from './controllers/GameRecipeNewController.js';
import GameRecipeNewHelper from './helpers/GameRecipeNewHelper.jsx';
import RecipeEditModals from './elements/RecipeEditModals.jsx';
import useRecipeForm from './hooks/useRecipeForm.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game recipe creation page (issue #1449), gated on `can_create_recipe` (the controller
 * redirects to the list otherwise), mirroring `GameCommonItemNew` minus the photo.
 *
 * @returns {React.ReactElement} Game recipe creation page element.
 */
export default function GameRecipeNew() {
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [canEditGame, setCanEditGame] = useState(false);
  const { fields, handlers, costModalProps } = useRecipeForm();

  const gameSlug = GameRecipeNewController.getGameSlugFromRecipeNewHash(getCurrentHash());
  const controller = useMemo(() => new GameRecipeNewController(setCanEditGame), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleSubmit = (event) => controller.submitForm(
    event, gameSlug, fields, canEditGame, { setStatus, setFieldErrors },
  );

  return (
    <>
      {GameRecipeNewHelper.render(
        {
          ...fields, status, fieldErrors, canEditGame, game_slug: gameSlug,
        },
        { ...handlers, onSubmit: handleSubmit },
      )}
      <RecipeEditModals {...costModalProps} />
    </>
  );
}
