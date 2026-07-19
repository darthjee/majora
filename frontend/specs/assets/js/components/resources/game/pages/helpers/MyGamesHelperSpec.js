import { renderToStaticMarkup } from 'react-dom/server';
import MyGamesHelper from '../../../../../../../../assets/js/components/resources/game/pages/helpers/MyGamesHelper.jsx';

describe('MyGamesHelper', function() {
  describe('.render', function() {
    it('renders a back button to the home page', function() {
      const html = renderToStaticMarkup(MyGamesHelper.render());
      expect(html).toContain('href="#/"');
    });

    it('renders the shared ListPage grid for the my-games list type', function() {
      const html = renderToStaticMarkup(MyGamesHelper.render());
      expect(html).toContain('container');
    });
  });
});
