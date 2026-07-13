import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameTreasures from '../../../../../../../assets/js/components/resources/treasure/pages/GameTreasures.jsx';
import GameTreasuresHelper from '../../../../../../../assets/js/components/resources/treasure/pages/helpers/GameTreasuresHelper.jsx';
import GameTreasuresController from '../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasuresController.js';
import Noop from '../../../../../../../assets/js/utils/Noop.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('GameTreasures', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/treasures' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while fetching', function() {
    stubBuildEffect(GameTreasuresController);
    stubRenderLoading(GameTreasuresHelper);

    const html = renderToStaticMarkup(React.createElement(GameTreasures));

    expect(html).toContain('loading');
  });

  it('renders an upload button per exclusive treasure via GameTreasuresHelper.render when canEdit is true', function() {
    stubBuildEffect(GameTreasuresController);

    const treasures = [{ id: 1, name: 'Golden Crown', value: 500, game_slug: 'demo' }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      GameTreasuresHelper.render(
        treasures, pagination, '#/games/demo/treasures', 'demo', '#/games/demo', true,
        '#/games/demo/treasures/new', Noop.noop,
      )
    );

    expect(html).toContain('actions-overlay-button');
  });

  it('renders the new treasure button via GameTreasuresHelper.render when canEdit is true', function() {
    stubBuildEffect(GameTreasuresController);

    const html = renderToStaticMarkup(
      GameTreasuresHelper.render(
        [], { page: 1, pages: 1, perPage: 10 }, '#/games/demo/treasures', 'demo', '#/games/demo', true,
        '#/games/demo/treasures/new',
      ),
    );

    expect(html).toContain('New Treasure');
    expect(html).toContain('href="#/games/demo/treasures/new"');
  });
});
