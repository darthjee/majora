import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameRecipeEdit from '../../../../../../../assets/js/components/resources/recipe/pages/GameRecipeEdit.jsx';
import RecipeEditHelper from '../../../../../../../assets/js/components/resources/recipe/pages/helpers/RecipeEditHelper.jsx';
import Noop from '../../../../../../../assets/js/utils/Noop.js';

const loadedRecipe = { id: 5, name: 'Brew', output: { id: 3, name: 'Potion' } };
let submitSpy;

/** Stub controller that synchronously loads a recipe. */
class LoadedController {
  constructor({ setRecipe, setLoading }) {
    setRecipe(loadedRecipe);
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
  submitForm(...args) { return submitSpy(...args); }
  // eslint-disable-next-line no-empty-function
  applyLoadedRecipe() {}
}

/** Stub controller that stays in the loading state. */
class LoadingController {
  buildEffect() { return () => Noop.noop; }
  // eslint-disable-next-line no-empty-function
  applyLoadedRecipe() {}
}

/** Stub controller that synchronously sets an error. */
class ErroredController {
  constructor({ setError, setLoading }) {
    setError('Unable to load recipe.');
    setLoading(false);
  }

  buildEffect() { return () => Noop.noop; }
  // eslint-disable-next-line no-empty-function
  applyLoadedRecipe() {}
}

describe('GameRecipeEdit', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/recipes/5/edit' } };
    submitSpy = jasmine.createSpy('submitForm').and.returnValue(Promise.resolve());
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  const render = (ControllerClass) => renderToStaticMarkup(React.createElement(GameRecipeEdit, { ControllerClass }));

  it('renders the loading state', function() {
    expect(render(LoadingController)).toContain('Loading recipe...');
  });

  it('renders the error state', function() {
    expect(render(ErroredController)).toContain('Unable to load recipe.');
  });

  it('renders the edit form', function() {
    const html = render(LoadedController);

    expect(html).toContain('Edit Recipe');
    expect(html).toContain('Save changes');
  });

  it('submits with the loaded output id', function() {
    let captured;
    spyOn(RecipeEditHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'form');
    });

    render(LoadedController);
    captured.handlers.onSubmit('event');

    expect(captured.state.game_slug).toBe('demo');
    expect(submitSpy).toHaveBeenCalledWith(
      'event',
      {
        gameSlug: 'demo', recipeId: '5', initialOutputId: 3, canEditGame: false,
      },
      jasmine.any(Object),
      jasmine.any(Object),
    );
  });
});
