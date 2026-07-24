import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameItems from '../../../../../../../assets/js/components/resources/item/pages/GameItems.jsx';
import GameItemsHelper from '../../../../../../../assets/js/components/resources/item/pages/helpers/GameItemsHelper.jsx';
import GameItemsController from '../../../../../../../assets/js/components/resources/item/pages/controllers/GameItemsController.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameItems', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/items' } };
    stubBuildEffect(GameItemsController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('resolves the game slug from the hash and delegates to GameItemsHelper', function() {
    let capturedState;

    spyOn(GameItemsHelper, 'render').and.callFake((state) => {
      capturedState = state;
      return React.createElement('div', null, 'page');
    });

    renderToStaticMarkup(React.createElement(GameItems));

    expect(capturedState.gameSlug).toBe('demo');
    expect(capturedState.basePath).toBe('#/games/demo/items');
    expect(capturedState.backHref).toBe('#/games/demo');
    expect(capturedState.newHref).toBe('#/games/demo/items/new');
    expect(capturedState.canCreateItem).toBe(false);
  });
});
