import { renderToStaticMarkup } from 'react-dom/server';
import GameCardHelper from '../../../../../../assets/js/components/elements/helpers/GameCardHelper.jsx';

describe('GameCardHelper', function() {
  const game = { name: 'Dragon Quest', game_slug: 'dragon-quest', cover_photo_path: null };

  describe('.render', function() {
    it('renders the game name', function() {
      expect(renderToStaticMarkup(GameCardHelper.render(game))).toContain('Dragon Quest');
    });

    it('links to the game detail page', function() {
      expect(renderToStaticMarkup(GameCardHelper.render(game))).toContain('href="#/games/dragon-quest"');
    });

    it('renders the default game photo when cover_photo_path is null', function() {
      const html = renderToStaticMarkup(GameCardHelper.render(game));
      expect(html).toContain('<img');
      expect(html).toContain('default_game.png');
      expect(html).not.toContain('No image');
    });

    it('renders an image when cover_photo_path is provided', function() {
      const gameWithPhoto = { ...game, cover_photo_path: 'http://example.com/cover_photo.png' };
      const html = renderToStaticMarkup(GameCardHelper.render(gameWithPhoto));
      expect(html).toContain('<img');
      expect(html).toContain('http://example.com/cover_photo.png');
      expect(html).not.toContain('No image');
    });

    it('applies Bootstrap card classes', function() {
      const html = renderToStaticMarkup(GameCardHelper.render(game));
      expect(html).toContain('card');
      expect(html).toContain('card-body');
      expect(html).toContain('card-title');
    });
  });
});
