import { renderToStaticMarkup } from 'react-dom/server';
import GamesHelper from '../../../../../../assets/js/components/pages/helpers/GamesHelper.jsx';

describe('GamesHelper', function() {
  describe('.render', function() {
    it('renders game cards for each game', function() {
      const games = [
        { name: 'Game A', game_slug: 'game-a', photo: null },
        { name: 'Game B', game_slug: 'game-b', photo: null },
      ];
      const pagination = { page: 1, pages: 1, perPage: 10 };
      const html = renderToStaticMarkup(GamesHelper.render(games, pagination));
      expect(html).toContain('Game A');
      expect(html).toContain('Game B');
    });

    it('renders pagination when there are multiple pages', function() {
      const games = [{ name: 'Game A', game_slug: 'game-a', photo: null }];
      const pagination = { page: 1, pages: 5, perPage: 10 };
      const html = renderToStaticMarkup(GamesHelper.render(games, pagination));
      expect(html).toContain('pagination');
    });

    it('does not render pagination for a single page', function() {
      const games = [{ name: 'Game A', game_slug: 'game-a', photo: null }];
      const pagination = { page: 1, pages: 1, perPage: 10 };
      const html = renderToStaticMarkup(GamesHelper.render(games, pagination));
      expect(html).not.toContain('pagination');
    });
  });

  describe('.renderLoading', function() {
    it('renders loading text', function() {
      const html = renderToStaticMarkup(GamesHelper.renderLoading());
      expect(html).toContain('Loading games...');
    });
  });

  describe('.renderError', function() {
    it('renders the error message in an alert', function() {
      const html = renderToStaticMarkup(GamesHelper.renderError('Unable to load games.'));
      expect(html).toContain('Unable to load games.');
      expect(html).toContain('alert');
    });
  });
});
