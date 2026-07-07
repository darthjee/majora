import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasureEdit from '../../../../../assets/js/components/pages/GameTreasureEdit.jsx';
import GameTreasureEditController from '../../../../../assets/js/components/pages/controllers/GameTreasureEditController.js';
import GameTreasureEditHelper from '../../../../../assets/js/components/pages/helpers/GameTreasureEditHelper.jsx';
import { stubBuildEffect, stubRenderLoading } from '../../../../support/controllerStubs.js';

describe('GameTreasureEdit', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/treasures/42/edit' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state on initial render before the fetch resolves', function() {
    stubBuildEffect(GameTreasureEditController);
    stubRenderLoading(GameTreasureEditHelper);

    const html = renderToStaticMarkup(React.createElement(GameTreasureEdit));

    expect(html).toContain('loading');
  });
});
