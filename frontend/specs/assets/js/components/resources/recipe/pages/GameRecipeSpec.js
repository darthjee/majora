import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameRecipe from '../../../../../../../assets/js/components/resources/recipe/pages/GameRecipe.jsx';
import RecipeDetailHelper
  from '../../../../../../../assets/js/components/resources/recipe/pages/helpers/RecipeDetailHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedRecipe = { id: 5, name: 'Brew', output: null, yield_quantity: 1 };

/** Stub controller that synchronously loads a recipe with edit permission. */
class LoadedController {
  constructor(setRecipe, setLoading, setError, setCanEdit) {
    setRecipe(loadedRecipe);
    setCanEdit(true);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that stays in the loading state. */
class LoadingController {
  buildEffect() { return () => Noop.noop; }
}

/** Stub controller that synchronously sets an error. */
class ErroredController {
  constructor(setRecipe, setLoading, setError) {
    setError('Unable to load recipe.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
}

describe('GameRecipe', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/recipes/5' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const render = (ControllerClass) => renderToStaticMarkup(React.createElement(GameRecipe, { ControllerClass }));

  it('renders the loading state while loading', function() {
    expect(render(LoadingController)).toContain('Loading recipe...');
  });

  it('renders the error state when the recipe fails to load', function() {
    expect(render(ErroredController)).toContain('Unable to load recipe.');
  });

  it('delegates to RecipeDetailHelper with the recipe, links and edit permission', function() {
    spyOn(RecipeDetailHelper, 'render').and.returnValue(React.createElement('div', null, 'detail'));

    render(LoadedController);

    expect(RecipeDetailHelper.render).toHaveBeenCalledWith(
      loadedRecipe,
      { gameSlug: 'demo', backHref: '#/games/demo/recipes', editHref: '#/games/demo/recipes/5/edit' },
      true,
    );
  });

  it('renders the unknown output label for a masked output', function() {
    expect(render(LoadedController)).toContain('Unknown item');
  });
});
