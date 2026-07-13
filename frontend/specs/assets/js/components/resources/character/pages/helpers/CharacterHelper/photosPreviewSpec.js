import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import { character } from './support.js';

describe('CharacterHelper', function() {
  describe('photos preview section', function() {
    it('renders the heading and each photo card, defaulting to an empty list', function() {
      const withPhotos = {
        ...character,
        photos: [{ id: 1, path: '/photos/1.jpg' }],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(withPhotos, '#/games/demo/pcs'));
      expect(html).toContain('Photos');
      expect(html).toContain('/photos/1.jpg');
      expect(renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'))).toContain('Photos');
    });

    it('does not wrap the photo cards in a clickable control', function() {
      const withPhotos = {
        ...character,
        photos: [{ id: 1, path: '/photos/1.jpg' }],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(withPhotos, '#/games/demo/pcs'));
      expect(html).not.toContain('<button');
    });

    it('renders a see all link to the pcs photos page', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: true, photos: [] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/photos"');
    });

    it('renders a see all link to the npcs photos page', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: false, photos: [] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('href="#/games/demo/npcs/7/photos"');
    });
  });
});
