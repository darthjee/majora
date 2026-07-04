import { renderToStaticMarkup } from 'react-dom/server';
import GameSessionsHelper from '../../../../../../assets/js/components/pages/helpers/GameSessionsHelper.jsx';

describe('GameSessionsHelper', function() {
  const sessions = [
    { id: 1, title: 'Session 1', date: '2024-01-01', game_slug: 'demo' },
    { id: 2, title: 'Session 2', date: null, game_slug: 'demo' },
  ];
  const pagination = { page: 1, pages: 3, perPage: 10 };

  describe('.render', function() {
    it('renders each session title', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(sessions, pagination, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('Session 1');
      expect(html).toContain('Session 2');
    });

    it('renders session links to the game session detail page', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(sessions, pagination, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('href="#/games/demo/sessions/1"');
      expect(html).toContain('href="#/games/demo/sessions/2"');
    });

    it('renders the session date when present', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(sessions, pagination, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('2024-01-01');
    });

    it('renders a no-date placeholder when the session has no date', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(sessions, pagination, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('No date');
    });

    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(sessions, pagination, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(sessions, pagination, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('pagination');
    });

    it('does not render the new session button when canEdit is false', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(
          sessions, pagination, '#/games/demo/sessions', '#/games/demo', false, '#/games/demo/sessions/new',
        ),
      );
      expect(html).not.toContain('New Session');
    });

    it('renders the new session button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(
          sessions, pagination, '#/games/demo/sessions', '#/games/demo', true, '#/games/demo/sessions/new',
        ),
      );
      expect(html).toContain('New Session');
      expect(html).toContain('href="#/games/demo/sessions/new"');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      const html = renderToStaticMarkup(GameSessionsHelper.renderLoading());
      expect(html).toContain('Loading');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(GameSessionsHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
