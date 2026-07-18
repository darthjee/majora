import { renderToStaticMarkup } from 'react-dom/server';
import GamePlayersHelper from '../../../../../../../../assets/js/components/resources/player/pages/helpers/GamePlayersHelper.jsx';

describe('GamePlayersHelper', function() {
  describe('.render', function() {
    it('renders the page heading', function() {
      const html = renderToStaticMarkup(GamePlayersHelper.render('demo'));
      expect(html).toContain('Players');
    });

    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(GamePlayersHelper.render('demo'));
      expect(html).toContain('href="#/games/demo"');
    });

    it('renders no New/Add button', function() {
      const html = renderToStaticMarkup(GamePlayersHelper.render('demo'));
      expect(html).not.toContain('btn-primary');
    });

    it('renders the shared ListPage grid for the players list type', function() {
      const html = renderToStaticMarkup(GamePlayersHelper.render('demo'));
      expect(html).toContain('container');
    });
  });
});
