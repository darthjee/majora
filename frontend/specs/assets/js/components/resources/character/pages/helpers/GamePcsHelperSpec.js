import { renderToStaticMarkup } from 'react-dom/server';
import GamePcsHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/GamePcsHelper.jsx';

describe('GamePcsHelper', function() {
  describe('.render', function() {
    it('renders the page heading', function() {
      const html = renderToStaticMarkup(GamePcsHelper.render('demo'));
      expect(html).toContain('Player Characters');
    });

    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(GamePcsHelper.render('demo'));
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders no New/Add button', function() {
      const html = renderToStaticMarkup(GamePcsHelper.render('demo'));
      expect(html).not.toContain('btn-primary');
    });

    it('renders the shared ListPage grid for the pcs list type', function() {
      const html = renderToStaticMarkup(GamePcsHelper.render('demo'));
      expect(html).toContain('container');
    });
  });
});
