import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GameHelper.jsx';
import { game } from './support.js';

describe('GameHelper', function() {
  describe('.render', function() {
    it('does not render a treasures button or a photos button', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).not.toContain(`href="#/games/${game.game_slug}/treasures"`);
      expect(html).not.toContain(`href="#/games/${game.game_slug}/photos"`);
    });

    it('renders a button to the sessions page', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).toContain(`href="#/games/${game.game_slug}/sessions"`);
    });
  });
});
