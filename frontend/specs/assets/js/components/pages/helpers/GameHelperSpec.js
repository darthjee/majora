import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../assets/js/components/pages/helpers/GameHelper.jsx';

describe('GameHelper', function() {
  const game = {
    name: 'Epic Quest',
    game_slug: 'epic-quest',
    photo: null,
    description: 'A heroic adventure.',
  };

  describe('.render', function() {
    it('renders the game name', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('Epic Quest');
    });

    it('renders the game description', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('A heroic adventure.');
    });

    it('does not render description paragraph when description is empty', function() {
      const gameNoDesc = { ...game, description: '' };
      expect(renderToStaticMarkup(GameHelper.render(gameNoDesc))).not.toContain('<p');
    });

    it('renders a link to the NPCs page', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('href="#/games/epic-quest/npcs"');
    });

    it('renders a back button to the games page', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('href="#/games"');
    });

    it('renders the player characters preview section', function() {
      const pcs = [{ id: 1, name: 'Aragorn', avatar_url: null }];
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
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameHelper.renderLoading())).toContain('Loading game');
    });
  });

  describe('.renderError', function() {
    it('renders the error message in an alert', function() {
      const html = renderToStaticMarkup(GameHelper.renderError('Something went wrong'));
      expect(html).toContain('Something went wrong');
      expect(html).toContain('alert');
    });
  });
});
