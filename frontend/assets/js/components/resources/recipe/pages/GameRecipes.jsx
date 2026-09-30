import { useCallback, useEffect, useMemo, useState } from 'react';
import GameRecipesHelper from './helpers/GameRecipesHelper.jsx';
import GameRecipesController from './controllers/GameRecipesController.js';
import BasePageController from '../../../common/base/controllers/BasePageController.js';
import HashRouteResolver from '../../../../utils/routing/HashRouteResolver.js';
import getCurrentHash from '../../../../utils/routing/currentHash.js';

/**
 * Game Recipes index page (issue #1449), mirroring `GameCommonItems` plus a category filter.
 *
 * @description Resolves `can_create_recipe` through {@link GameRecipesController}, rather than
 *   `ListPage`'s built-in `canEdit`. Changing the category filter rewrites the hash (resetting to
 *   page 1) and bumps the list's refresh token.
 * @returns {React.ReactElement} Game recipes page element.
 */
export default function GameRecipes() {
  const [canCreateRecipe, setCanCreateRecipe] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [itemsCount, setItemsCount] = useState(null);

  const currentHash = getCurrentHash();
  const gameSlug = BasePageController.extractParam('/games/:game_slug/recipes', 'game_slug', currentHash);
  const basePath = `#/games/${gameSlug}/recipes`;
  const activeFilters = Object.fromEntries(new HashRouteResolver().getFilterParams());

  const controller = useMemo(() => new GameRecipesController(setCanCreateRecipe), []);

  useEffect(() => controller.buildEffect()(), [controller]);

  const handleFilterQuery = useCallback((filters) => {
    window.location.hash = GameRecipesController.buildFilterQueryHash(basePath, filters);
    setItemsCount(null);
    setRefreshToken((token) => token + 1);
  }, [basePath]);

  return GameRecipesHelper.render(
    {
      gameSlug,
      basePath,
      backHref: `#/games/${gameSlug}`,
      newHref: `#/games/${gameSlug}/recipes/new`,
      canCreateRecipe,
      activeFilters,
      refreshToken,
      itemsCount,
    },
    {
      onFilterQuery: handleFilterQuery,
      onItemsChange: (items) => setItemsCount(items.length),
    },
  );
}
