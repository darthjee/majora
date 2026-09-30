import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameRecipes from '../../../../../../../assets/js/components/resources/recipe/pages/GameRecipes.jsx';
import GameRecipesHelper
  from '../../../../../../../assets/js/components/resources/recipe/pages/helpers/GameRecipesHelper.jsx';
import GameRecipesController
  from '../../../../../../../assets/js/components/resources/recipe/pages/controllers/GameRecipesController.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameRecipes', function() {
  let originalWindow;
  let captured;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/recipes?category=potion' } };
    stubBuildEffect(GameRecipesController);
    spyOn(GameRecipesHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'page');
    });
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('resolves the game slug from the hash and delegates to GameRecipesHelper', function() {
    renderToStaticMarkup(React.createElement(GameRecipes));

    expect(captured.state).toEqual({
      gameSlug: 'demo',
      basePath: '#/games/demo/recipes',
      backHref: '#/games/demo',
      newHref: '#/games/demo/recipes/new',
      canCreateRecipe: false,
      activeFilters: { category: 'potion' },
      refreshToken: 0,
      itemsCount: null,
    });
  });

  it('rewrites the hash to page 1 with the selected filters on filter query', function() {
    renderToStaticMarkup(React.createElement(GameRecipes));

    captured.handlers.onFilterQuery({ category: 'gear' });

    expect(globalThis.window.location.hash).toBe('#/games/demo/recipes?page=1&category=gear');
  });
});
