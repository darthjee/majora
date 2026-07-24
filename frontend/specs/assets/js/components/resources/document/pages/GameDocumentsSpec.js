import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameDocuments from '../../../../../../../assets/js/components/resources/document/pages/GameDocuments.jsx';
import GameDocumentsHelper
  from '../../../../../../../assets/js/components/resources/document/pages/helpers/GameDocumentsHelper.jsx';
import GameDocumentsController
  from '../../../../../../../assets/js/components/resources/document/pages/controllers/GameDocumentsController.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('GameDocuments', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/documents' } };
    stubBuildEffect(GameDocumentsController);
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('resolves the game slug from the hash and delegates to GameDocumentsHelper', function() {
    let capturedState;

    spyOn(GameDocumentsHelper, 'render').and.callFake((state) => {
      capturedState = state;
      return React.createElement('div', null, 'page');
    });

    renderToStaticMarkup(React.createElement(GameDocuments));

    expect(capturedState.gameSlug).toBe('demo');
    expect(capturedState.basePath).toBe('#/games/demo/documents');
    expect(capturedState.backHref).toBe('#/games/demo');
    expect(capturedState.newHref).toBe('#/games/demo/documents/new');
    expect(capturedState.canCreateDocument).toBe(false);
  });
});
