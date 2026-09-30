import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameRecipeNew from '../../../../../../../assets/js/components/resources/recipe/pages/GameRecipeNew.jsx';
import GameRecipeNewHelper from '../../../../../../../assets/js/components/resources/recipe/pages/helpers/GameRecipeNewHelper.jsx';
import GameRecipeNewController
  from '../../../../../../../assets/js/components/resources/recipe/pages/controllers/GameRecipeNewController.js';
import { RECIPE_FORM_DEFAULTS } from '../../../../../../../assets/js/components/resources/recipe/pages/recipeForm.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameRecipeNew', function() {
  let originalWindow;
  let captured;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/recipes/new' } };
    stubBuildEffect(GameRecipeNewController);
    spyOn(GameRecipeNewHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'form');
    });
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the empty form with the game slug', function() {
    renderToStaticMarkup(React.createElement(GameRecipeNew));

    expect(captured.state).toEqual({
      ...RECIPE_FORM_DEFAULTS, status: 'idle', fieldErrors: {}, canEditGame: false, game_slug: 'demo',
    });
  });

  it('submits through the controller', function() {
    spyOn(GameRecipeNewController.prototype, 'submitForm').and.returnValue(Promise.resolve());
    renderToStaticMarkup(React.createElement(GameRecipeNew));

    captured.handlers.onSubmit('event');

    expect(GameRecipeNewController.prototype.submitForm).toHaveBeenCalledWith(
      'event', 'demo', RECIPE_FORM_DEFAULTS, false, jasmine.any(Object),
    );
  });

  it('renders the full form markup', function() {
    GameRecipeNewHelper.render.and.callThrough();

    const html = renderToStaticMarkup(React.createElement(GameRecipeNew));

    expect(html).toContain('New Recipe');
    expect(html).toContain('Create Recipe');
  });
});
