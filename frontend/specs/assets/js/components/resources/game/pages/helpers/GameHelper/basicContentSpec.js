import { renderToStaticMarkup } from 'react-dom/server';
import GameHelper from '../../../../../../../../../assets/js/components/resources/game/pages/helpers/GameHelper.jsx';
import { game } from './support.js';

describe('GameHelper', function() {
  describe('.render', function() {
    it('renders the game name', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('Epic Quest');
    });

    it('renders the game description', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('A heroic adventure.');
    });

    it('renders the description with the text-pre-wrap class to preserve line breaks', function() {
      const gameWithMultilineDesc = { ...game, description: 'Line one.\nLine two.' };
      const html = renderToStaticMarkup(GameHelper.render(gameWithMultilineDesc));
      expect(html).toContain('text-pre-wrap');
      expect(html).toContain('Line one.\nLine two.');
    });

    it('does not render description paragraph when description is empty', function() {
      const gameNoDesc = { ...game, description: '' };
      const html = renderToStaticMarkup(GameHelper.render(gameNoDesc));
      expect(html).not.toContain('text-pre-wrap');
    });

    it('renders a back button to the games page', function() {
      expect(renderToStaticMarkup(GameHelper.render(game))).toContain('href="#/games"');
    });
  });
});
