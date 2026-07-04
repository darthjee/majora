import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GameSessions from '../../../../../assets/js/components/pages/GameSessions.jsx';
import GameSessionsHelper from '../../../../../assets/js/components/pages/helpers/GameSessionsHelper.jsx';
import GameSessionsController from '../../../../../assets/js/components/pages/controllers/GameSessionsController.js';

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
    spyOn(GameSessionsController.prototype, 'buildEffect').and.returnValue(() => () => {});
    spyOn(GameSessionsHelper, 'renderLoading').and.returnValue(React.createElement('div', null, 'loading'));

    const html = renderToStaticMarkup(React.createElement(GameSessions));

    expect(html).toContain('loading');
  });

  it('renders the new session button via GameSessionsHelper.render when canEdit is true', function() {
    spyOn(GameSessionsController.prototype, 'buildEffect').and.returnValue(() => () => {});

    const sessions = [{ id: 1, title: 'Session 1', date: '2024-01-01', game_slug: 'demo' }];
    const pagination = { page: 1, pages: 1, perPage: 10 };
    const html = renderToStaticMarkup(
      GameSessionsHelper.render(
        sessions, pagination, '#/games/demo/sessions', '#/games/demo', true, '#/games/demo/sessions/new',
      ),
    );

    expect(html).toContain('New Session');
  });
});
