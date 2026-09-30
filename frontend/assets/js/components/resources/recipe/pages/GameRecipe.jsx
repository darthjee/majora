import { useEffect, useMemo, useState } from 'react';
import RecipeDetailHelper from './helpers/RecipeDetailHelper.jsx';
import GameRecipeController from './controllers/GameRecipeController.js';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game recipe detail page (issue #1449): loads a single `GameRecipe` via
 * {@link GameRecipeController} and delegates rendering to {@link RecipeDetailHelper}, with an Edit
 * button gated on the controller's `canEdit` flag. Photo-less: no upload modal.
 *
 * @param {object} [props] - Component props.
 * @param {Function} [props.ControllerClass] - Recipe controller class to instantiate, mainly for
 *   tests.
 * @returns {React.ReactElement} Game recipe detail page element.
 */
export default function GameRecipe({ ControllerClass = GameRecipeController }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canEdit, setCanEdit] = useState(false);

  const controller = useMemo(
    () => new ControllerClass(setRecipe, setLoading, setError, setCanEdit),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  if (loading) return RecipeDetailHelper.renderLoading();
  if (error) return RecipeDetailHelper.renderError(error);

  const { game_slug: gameSlug } = GameRecipeController.getParamsFromHash(getCurrentHash());

  return RecipeDetailHelper.render(
    recipe,
    {
      gameSlug,
      backHref: `#/games/${gameSlug}/recipes`,
      editHref: `#/games/${gameSlug}/recipes/${recipe?.id}/edit`,
    },
    canEdit,
  );
}
