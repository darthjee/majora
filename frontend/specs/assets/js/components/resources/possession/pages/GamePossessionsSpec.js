import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePossessions from '../../../../../../../assets/js/components/resources/possession/pages/GamePossessions.jsx';
import GamePossessionsHelper
  from '../../../../../../../assets/js/components/resources/possession/pages/helpers/GamePossessionsHelper.jsx';
import GamePossessionsController
  from '../../../../../../../assets/js/components/resources/possession/pages/controllers/GamePossessionsController.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GamePossessions', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/possessions' } };
    stubBuildEffect(GamePossessionsController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('resolves the game slug from the hash and delegates to GamePossessionsHelper', function() {
    let capturedState;

    spyOn(GamePossessionsHelper, 'render').and.callFake((state) => {
      capturedState = state;
      return React.createElement('div', null, 'page');
    });

    renderToStaticMarkup(React.createElement(GamePossessions));

    expect(capturedState.gameSlug).toBe('demo');
    expect(capturedState.basePath).toBe('#/games/demo/possessions');
    expect(capturedState.backHref).toBe('#/games/demo');
    expect(capturedState.newHref).toBe('#/games/demo/possessions/new');
    expect(capturedState.canCreatePossession).toBe(false);
  });
});
