import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePcs from '../../../../../assets/js/components/pages/GamePcs.jsx';
import GameCharactersHelper from '../../../../../assets/js/components/pages/helpers/GameCharactersHelper.jsx';
import GamePcsController from '../../../../../assets/js/components/pages/controllers/GamePcsController.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../support/controllerStubs.js';

describe('GamePcs', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/pcs' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while fetching', function() {
    stubBuildEffect(GamePcsController);
    stubRenderLoading(GameCharactersHelper);

    const html = renderToStaticMarkup(React.createElement(GamePcs));

    expect(html).toContain('loading');
  });

  it('does not render a New button when GameCharactersHelper.render is called without canEdit/newHref', function() {
    const html = renderToStaticMarkup(
      GameCharactersHelper.render(
        [], { page: 1, pages: 1, perPage: 10 }, '#/games/demo/pcs', 'demo',
        'Player Characters', 'pc', '#/games/demo',
      ),
    );

    expect(html).not.toContain('New NPC');
    expect(html).not.toContain('btn btn-primary mb-3');
  });
});
