import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameNpcs from '../../../../../assets/js/components/pages/GameNpcs.jsx';
import GameCharactersHelper from '../../../../../assets/js/components/pages/helpers/GameCharactersHelper.jsx';
import GameNpcsController from '../../../../../assets/js/components/pages/controllers/GameNpcsController.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../support/controllerStubs.js';

describe('GameNpcs', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/npcs' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while fetching', function() {
    stubBuildEffect(GameNpcsController);
    stubRenderLoading(GameCharactersHelper);

    const html = renderToStaticMarkup(React.createElement(GameNpcs));

    expect(html).toContain('loading');
  });

  it('renders the new NPC button via GameCharactersHelper.render when canEdit is true', function() {
    stubBuildEffect(GameNpcsController);

    const html = renderToStaticMarkup(
      GameCharactersHelper.render(
        [], { page: 1, pages: 1, perPage: 10 }, '#/games/demo/npcs', 'demo',
        'Non-Player Characters', 'npc', '#/games/demo', true, '#/games/demo/npcs/new',
      ),
    );

    expect(html).toContain('New NPC');
    expect(html).toContain('href="#/games/demo/npcs/new"');
  });
});
