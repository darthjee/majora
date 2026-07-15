import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GamePolls from '../../../../../../../assets/js/components/resources/game/pages/GamePolls.jsx';
import GamePollsHelper from '../../../../../../../assets/js/components/resources/game/pages/helpers/GamePollsHelper.jsx';
import GamePollsController from '../../../../../../../assets/js/components/resources/game/pages/controllers/GamePollsController.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('GamePolls', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/polls' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while fetching', function() {
    stubBuildEffect(GamePollsController);
    stubRenderLoading(GamePollsHelper);

    const html = renderToStaticMarkup(React.createElement(GamePolls));

    expect(html).toContain('loading');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
    stubBuildEffect(GamePollsController);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(GamePolls));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(GamePollsController));
  });

  it('renders the polls list via GamePollsHelper.render', function() {
    const html = renderToStaticMarkup(GamePollsHelper.render({
      polls: [{ id: 1, title: 'Which tavern?', type: 'single', status: 'open' }],
      pagination: { page: 1, pages: 1, perPage: 10 },
      gameSlug: 'demo',
      basePath: '#/games/demo/polls',
      backHref: '#/games/demo',
      newHref: '#/games/demo/polls/new',
    }));

    expect(html).toContain('Which tavern?');
    expect(html).toContain('href="#/games/demo/polls/new"');
  });
});
