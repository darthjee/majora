import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameCommonItems from '../../../../../../../assets/js/components/resources/common_item/pages/GameCommonItems.jsx';
import GameCommonItemsHelper
  from '../../../../../../../assets/js/components/resources/common_item/pages/helpers/GameCommonItemsHelper.jsx';
import GameCommonItemsController
  from '../../../../../../../assets/js/components/resources/common_item/pages/controllers/GameCommonItemsController.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameCommonItems', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/common_items' } };
    stubBuildEffect(GameCommonItemsController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('resolves the game slug from the hash and delegates to GameCommonItemsHelper', function() {
    let capturedState;

    spyOn(GameCommonItemsHelper, 'render').and.callFake((state) => {
      capturedState = state;
      return React.createElement('div', null, 'page');
    });

    renderToStaticMarkup(React.createElement(GameCommonItems));

    expect(capturedState.gameSlug).toBe('demo');
    expect(capturedState.basePath).toBe('#/games/demo/common_items');
    expect(capturedState.backHref).toBe('#/games/demo');
    expect(capturedState.newHref).toBe('#/games/demo/common_items/new');
    expect(capturedState.canCreateCommonItem).toBe(false);
  });
});
