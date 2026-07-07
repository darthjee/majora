import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';
import { character } from './support.js';

describe('CharacterHelper', function() {
  describe('.render', function() {
    it('applies the green border class for an allied NPC', function() {
      const c = { ...character, is_pc: false, allegiance: 'ally' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('border-success');
    });

    it('applies the red border class for an enemy NPC', function() {
      const c = { ...character, is_pc: false, allegiance: 'enemy' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('border-danger');
    });

    it('applies the gray border class for a neutral NPC', function() {
      const c = { ...character, is_pc: false, allegiance: 'neutral' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('border-secondary');
    });

    it('applies the gray border class for an NPC with a missing allegiance', function() {
      const c = { ...character, is_pc: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('border-secondary');
    });

    it('does not apply any border class for a PC, regardless of allegiance', function() {
      const c = { ...character, is_pc: true, allegiance: 'enemy' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('border-success');
      expect(html).not.toContain('border-danger');
      expect(html).not.toContain('border-secondary');
    });
  });
});
