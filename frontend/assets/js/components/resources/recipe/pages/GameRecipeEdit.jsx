import { useEffect, useMemo, useState } from 'react';
import GameRecipeEditController from './controllers/GameRecipeEditController.js';
import RecipeEditHelper from './helpers/RecipeEditHelper.jsx';
import RecipeEditModals from './elements/RecipeEditModals.jsx';
import useRecipeForm from './hooks/useRecipeForm.js';
import useApplyLoadedRecipe from './hooks/useApplyLoadedRecipe.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game recipe edit page (issue #1449): loads the recipe via {@link GameRecipeEditController},
 * pre-fills the form and PATCHes it on submit, mirroring `GameCommonItemEdit` minus the photo.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Recipe edit controller class, mainly for tests.
 * @returns {React.ReactElement} Game recipe edit page element.
 */
export default function GameRecipeEdit({ ControllerClass = GameRecipeEditController }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [canEditGame, setCanEditGame] = useState(false);
  const {
    fields, setField, handlers, costModalProps,
  } = useRecipeForm();

  const controller = useMemo(
    () => new ControllerClass({
      setRecipe, setLoading, setError, setCanEditGame,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { game_slug: gameSlug, id: recipeId } = GameRecipeEditController.getParamsFromHash(getCurrentHash());

  useEffect(() => controller.buildEffect()(), [controller]);
  useApplyLoadedRecipe(controller, recipe, setField);

  if (loading) return RecipeEditHelper.renderLoading();
  if (error) return RecipeEditHelper.renderError(error);

  const handleSubmit = (event) => controller.submitForm(
    event,
    {
      gameSlug, recipeId, initialOutputId: recipe?.output?.id ?? null, canEditGame,
    },
    fields,
    { setStatus, setFieldErrors },
  );

  return (
    <>
      {RecipeEditHelper.render(
        {
          ...fields, status, fieldErrors, canEditGame, game_slug: gameSlug,
        },
        { ...handlers, onSubmit: handleSubmit },
      )}
      <RecipeEditModals {...costModalProps} />
    </>
  );
}
