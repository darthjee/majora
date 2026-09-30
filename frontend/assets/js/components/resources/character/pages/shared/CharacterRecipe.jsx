import { useEffect, useMemo, useState } from 'react';
import CharacterRecipeDetailHelper from '../helpers/CharacterRecipeDetailHelper.jsx';
import CharacterRecipeDetailController from '../controllers/CharacterRecipeDetailController.js';
import FacadeRefresh from '../../../../../utils/access/useFacadeRefresh.js';
import getCurrentHash from '../../../../../utils/routing/currentHash.js';

/**
 * Shared PC/NPC recipe detail page component (issue #1450): loads a single `CharacterRecipe` via
 * {@link CharacterRecipeDetailController} and delegates rendering to
 * {@link CharacterRecipeDetailHelper}, mirroring `CharacterDocument`'s loading/error/effect
 * plumbing. The hidden switch (editors only) persists through the controller's `toggleHidden`.
 *
 * @param {object} props - Component props.
 * @param {string} props.characterKind - Character kind URL segment (`'pcs'` or `'npcs'`).
 * @param {Function} [props.ControllerClass] - Controller class to instantiate, mainly for tests.
 * @returns {React.ReactElement} Character recipe detail page element.
 */
export default function CharacterRecipe({ characterKind, ControllerClass = CharacterRecipeDetailController }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new ControllerClass(characterKind, setRecipe, setLoading, setError),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characterKind],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  const { game_slug: gameSlug, character_id: characterId } = CharacterRecipeDetailController
    .getParamsFromHash(characterKind, getCurrentHash());
  const backHref = `#/games/${gameSlug}/${characterKind}/${characterId}/recipes`;

  if (loading) return CharacterRecipeDetailHelper.renderLoading();
  if (error) return CharacterRecipeDetailHelper.renderError(error, backHref);

  return CharacterRecipeDetailHelper.render(
    recipe,
    { backHref, gameSlug },
    { onHiddenChange: (hidden) => controller.toggleHidden(recipe, hidden) },
  );
}
