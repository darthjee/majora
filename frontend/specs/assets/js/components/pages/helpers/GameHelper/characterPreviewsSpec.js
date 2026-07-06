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
    it('renders the player characters preview section', function() {
      const pcs = [{ id: 1, name: 'Aragorn', profile_photo_path: null }];
      const html = renderToStaticMarkup(GameHelper.render(game, pcs));
      expect(html).toContain('Player Characters');
      expect(html).toContain('Aragorn');
      expect(html).toContain('href="#/games/epic-quest/pcs"');
    });

    it('renders the preview section with no characters when pcs is empty', function() {
      const html = renderToStaticMarkup(GameHelper.render(game, []));
      expect(html).toContain('Player Characters');
      expect(html).toContain('href="#/games/epic-quest/pcs"');
    });

    it('renders the preview section when pcs is not provided', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('Player Characters');
    });

    it('renders the non-player characters preview section', function() {
      const npcs = [{ id: 2, name: 'Gandalf', profile_photo_path: null }];
      const html = renderToStaticMarkup(GameHelper.render(game, [], npcs));
      expect(html).toContain('Non-Player Characters');
      expect(html).toContain('Gandalf');
      expect(html).toContain('href="#/games/epic-quest/npcs"');
    });

    it('renders the preview section with no characters when npcs is empty', function() {
      const html = renderToStaticMarkup(GameHelper.render(game, [], []));
      expect(html).toContain('Non-Player Characters');
      expect(html).toContain('href="#/games/epic-quest/npcs"');
    });

    it('renders the npcs preview section when npcs is not provided', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('Non-Player Characters');
    });
  });
});
