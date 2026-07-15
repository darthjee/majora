import { renderToStaticMarkup } from 'react-dom/server';
import GameSessionsHelper from '../../../../../../../../assets/js/components/resources/game_session/pages/helpers/GameSessionsHelper.jsx';
import { buildDefaultSessionColumns } from '../../../../../../../../assets/js/components/resources/game_session/pages/sessionColumns.js';

describe('GameSessionsHelper', function() {
  const columns = {
    ...buildDefaultSessionColumns(),
    past: {
      sessions: [{ id: 1, title: 'Past Session', date: '2020-01-01', game_slug: 'demo' }],
      pagination: { page: 1, pages: 3, perPage: 10 },
    },
    future: {
      sessions: [{ id: 2, title: 'Future Session', date: '2099-01-01', game_slug: 'demo' }],
      pagination: { page: 2, pages: 4, perPage: 10 },
    },
    unscheduled: {
      sessions: [{ id: 3, title: 'Unscheduled Session', date: null, game_slug: 'demo' }],
      pagination: { page: 1, pages: 2, perPage: 10 },
    },
  };

  describe('.render', function() {
    it('renders each session title across the 3 columns', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(columns, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('Past Session');
      expect(html).toContain('Future Session');
      expect(html).toContain('Unscheduled Session');
    });

    it('renders the 3 column headings', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(columns, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('Past');
      expect(html).toContain('Upcoming');
      expect(html).toContain('Unscheduled');
    });

    it('renders session links to the game session detail page', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(columns, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('href="#/games/demo/sessions/1"');
      expect(html).toContain('href="#/games/demo/sessions/2"');
      expect(html).toContain('href="#/games/demo/sessions/3"');
    });

    it('renders the session date when present', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(columns, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('2020-01-01');
    });

    it('renders a no-date placeholder for the unscheduled session', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(columns, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('No date');
    });

    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(columns, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders an independent pagination nav per column using distinct page params', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(columns, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('past_page=');
      expect(html).toContain('future_page=');
      expect(html).toContain('unscheduled_page=');
    });

    it("preserves the other columns' current page/per_page on each column's pagination links", function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(columns, '#/games/demo/sessions', '#/games/demo'),
      );
      expect(html).toContain('future_page=2');
      expect(html).toContain('future_per_page=10');
    });

    it('does not render the new session button when canEdit is false', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(
          columns, '#/games/demo/sessions', '#/games/demo', false, '#/games/demo/sessions/new',
        ),
      );
      expect(html).not.toContain('New Session');
    });

    it('renders the new session button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        GameSessionsHelper.render(
          columns, '#/games/demo/sessions', '#/games/demo', true, '#/games/demo/sessions/new',
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
