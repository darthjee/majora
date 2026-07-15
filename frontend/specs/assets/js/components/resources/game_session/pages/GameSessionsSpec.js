import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameSessions from '../../../../../../../assets/js/components/resources/game_session/pages/GameSessions.jsx';
import GameSessionsHelper from '../../../../../../../assets/js/components/resources/game_session/pages/helpers/GameSessionsHelper.jsx';
import GameSessionsController from '../../../../../../../assets/js/components/resources/game_session/pages/controllers/GameSessionsController.js';
import { buildDefaultSessionColumns } from '../../../../../../../assets/js/components/resources/game_session/pages/sessionColumns.js';
import FacadeRefresh from '../../../../../../../assets/js/utils/access/useFacadeRefresh.js';
import { stubBuildEffect, stubRenderLoading } from '../../../../../../support/controllerStubs.js';

describe('GameSessions', function() {
  let originalWindow;

  beforeEach(function() {
    originalWindow = globalThis.window;
    globalThis.window = { location: { hash: '#/games/demo/sessions' } };
  });

  afterEach(function() {
    globalThis.window = originalWindow;
  });

  it('renders the loading state while fetching', function() {
    stubBuildEffect(GameSessionsController);
    stubRenderLoading(GameSessionsHelper);

    const html = renderToStaticMarkup(React.createElement(GameSessions));

    expect(html).toContain('loading');
  });

  it('wires FacadeRefresh.useFacadeRefresh with the page controller', function() {
    stubBuildEffect(GameSessionsController);
    spyOn(FacadeRefresh, 'useFacadeRefresh');

    renderToStaticMarkup(React.createElement(GameSessions));

    expect(FacadeRefresh.useFacadeRefresh).toHaveBeenCalledWith(jasmine.any(GameSessionsController));
  });

  it('renders the new session button via GameSessionsHelper.render when canEdit is true', function() {
    stubBuildEffect(GameSessionsController);

    const columns = buildDefaultSessionColumns();
    const html = renderToStaticMarkup(
      GameSessionsHelper.render(
        columns, '#/games/demo/sessions', '#/games/demo', true, '#/games/demo/sessions/new',
      ),
    );

    expect(html).toContain('New Session');
  });
});
