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

  describe('filters', function() {
    const capture = () => {
      const captured = {};
      spyOn(GameCommonItemsHelper, 'render').and.callFake((state, handlers) => {
        captured.state = state;
        captured.handlers = handlers;
        return React.createElement('div', null, 'page');
      });
      return captured;
    };

    it('passes the active filters from the hash', function() {
      globalThis.window = { location: { hash: '#/games/demo/common_items?name=rope&page=2' } };
      const captured = capture();

      renderToStaticMarkup(React.createElement(GameCommonItems));

      expect(captured.state.activeFilters).toEqual({ name: 'rope' });
      expect(captured.state.refreshToken).toBe(0);
    });

    it('sets the filtered hash on page 1 when querying', function() {
      const captured = capture();

      renderToStaticMarkup(React.createElement(GameCommonItems));
      captured.handlers.onFilterQuery({ name: 'rope' });

      expect(globalThis.window.location.hash).toBe('#/games/demo/common_items?page=1&name=rope');
    });

    it('resets the hash to the base path when clearing', function() {
      globalThis.window = { location: { hash: '#/games/demo/common_items?name=rope' } };
      const captured = capture();

      renderToStaticMarkup(React.createElement(GameCommonItems));
      captured.handlers.onFilterClear();

      expect(globalThis.window.location.hash).toBe('#/games/demo/common_items');
    });
  });
});
