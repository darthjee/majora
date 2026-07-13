import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import { character } from './support.js';

describe('CharacterHelper', function() {
  describe('.render', function() {
    it('renders a see all photos link in the photos preview section', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: true };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/photos"');
    });

    it('does not render the old inline photo gallery', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).not.toContain('img-fluid rounded');
    });

    it('renders a back button to the provided backHref', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs"');
    });
  });
});
