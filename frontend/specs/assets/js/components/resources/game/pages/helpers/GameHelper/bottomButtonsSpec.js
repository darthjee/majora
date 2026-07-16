import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GameHelper.jsx';
import { game } from './support.js';

describe('GameHelper', function() {
  describe('.render', function() {
    it('renders a treasures button and does not render a photos button', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).toContain(`href="#/games/${game.game_slug}/treasures"`);
      expect(html).not.toContain(`href="#/games/${game.game_slug}/photos"`);
    });

    it('renders a button to the sessions page', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).toContain(`href="#/games/${game.game_slug}/sessions"`);
    });
  });
});
