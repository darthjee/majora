import { renderToStaticMarkup } from 'react-dom/server';
import GamesHelper from '../../../../../../../../assets/js/components/resources/game/pages/helpers/GamesHelper.jsx';

describe('GamesHelper', function() {
  describe('.render', function() {
    it('renders a back button to the home page', function() {
      const html = renderToStaticMarkup(GamesHelper.render(true));
      expect(html).toContain('href="#/"');
    });

    it('renders a New Game link when logged in', function() {
      const html = renderToStaticMarkup(GamesHelper.render(true));
      expect(html).toContain('href="#/games/new"');
      expect(html).toContain('New Game');
    });

    it('does not render a New Game link when not logged in', function() {
      const html = renderToStaticMarkup(GamesHelper.render(false));
      expect(html).not.toContain('href="#/games/new"');
    });

    it('renders the shared ListPage grid for the games list type', function() {
      const html = renderToStaticMarkup(GamesHelper.render(true));
      expect(html).toContain('container');
    });
  });
});
