import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import { character } from './support.js';

describe('CharacterHelper', function() {
  describe('treasures preview section', function() {
    it('renders the heading and each treasure card with a quantity badge, defaulting to an empty list', function() {
      const withTreasures = {
        ...character,
        treasures: [{ id: 1, treasure_id: 9, name: 'Potion of Healing', quantity: 3, value: 50 }],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(withTreasures, '#/games/demo/pcs'));
      expect(html).toContain('Treasures');
      expect(html).toContain('Potion of Healing');
      expect(html).toContain('href="#/treasures/9"');
      expect(html).toContain('×3');
      expect(renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'))).toContain('Treasures');
    });

    it('does not render a quantity badge when the treasure quantity is 1', function() {
      const withTreasures = {
        ...character,
        treasures: [{ id: 1, treasure_id: 9, name: 'Potion of Healing', quantity: 1, value: 50 }],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(withTreasures, '#/games/demo/pcs'));
      expect(html).not.toContain('×1');
    });

    it('renders a see all link to the pcs treasures page', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: true, treasures: [] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/treasures"');
    });

    it('renders a see all link to the npcs treasures page', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: false, treasures: [] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('href="#/games/demo/npcs/7/treasures"');
    });
  });
});
