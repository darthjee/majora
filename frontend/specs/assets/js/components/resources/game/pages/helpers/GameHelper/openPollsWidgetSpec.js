import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GameHelper.jsx';
import { game } from './support.js';

describe('GameHelper', function() {
  describe('.render', function() {
    it('does not render the open-polls widget for a non-member', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).not.toContain('data-testid="open-polls-widget"');
    });

    it('renders the open-polls widget below the next session section for a DM', function() {
      const gameWithAccess = { ...game, is_dm: true };
      const html = renderToStaticMarkup(GameHelper.render(gameWithAccess));

      expect(html).toContain('data-testid="open-polls-widget"');
      expect(html).toContain(`href="#/games/${game.game_slug}/polls"`);
    });
  });
});
