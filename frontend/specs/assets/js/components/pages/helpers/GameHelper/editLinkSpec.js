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
    it('renders an edit link when can_edit is true', function() {
      const editableGame = { ...game, can_edit: true };
      const html = renderToStaticMarkup(GameHelper.render(editableGame));
      expect(html).toContain(`href="#/games/${game.game_slug}/edit"`);
    });

    it('does not render an edit link when can_edit is false', function() {
      const nonEditableGame = { ...game, can_edit: false };
      const html = renderToStaticMarkup(GameHelper.render(nonEditableGame));
      expect(html).not.toContain('/edit');
    });

    it('does not render an edit link when can_edit is absent', function() {
      const html = renderToStaticMarkup(GameHelper.render(game));
      expect(html).not.toContain('/edit');
    });

    it('renders the game name in h1 without a button inside', function() {
      const editableGame = { ...game, can_edit: true };
      const html = renderToStaticMarkup(GameHelper.render(editableGame));
      expect(html).toMatch(/<h1>[^<]*Epic Quest[^<]*<\/h1>/);
    });
  });
});
