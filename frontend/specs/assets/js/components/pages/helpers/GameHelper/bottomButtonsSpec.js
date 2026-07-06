import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../assets/js/components/pages/helpers/GameHelper.jsx';

describe('GameHelper', function() {
  const game = {
    name: 'Epic Quest',
    game_slug: 'epic-quest',
    cover_photo_path: null,
    description: 'A heroic adventure.',
  };

  describe('.render', function() {
    it('does not render the treasures/sessions/photos buttons at the bottom of the page', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).not.toContain(`href="#/games/${game.game_slug}/treasures"`);
      expect(html).not.toContain(`href="#/games/${game.game_slug}/sessions"`);
      expect(html).not.toContain(`href="#/games/${game.game_slug}/photos"`);
    });
  });
});
