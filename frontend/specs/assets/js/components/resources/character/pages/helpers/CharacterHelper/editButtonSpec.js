import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import { character } from './support.js';

describe('CharacterHelper', function() {
  describe('.render', function() {
    it('renders a pcs edit button when can_edit is true and is_pc is true', function() {
      const c = { ...character, can_edit: true, is_pc: true, game_slug: 'demo', id: 7 };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/edit"');
      expect(html).toContain('Edit');
    });

    it('renders an npcs edit button when can_edit is true and is_pc is false', function() {
      const c = { ...character, can_edit: true, is_pc: false, game_slug: 'demo', id: 7 };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('href="#/games/demo/npcs/7/edit"');
      expect(html).toContain('Edit');
    });

    it('does not render an edit button when can_edit is false', function() {
      const c = { ...character, can_edit: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('/edit"');
    });

    it('does not render an edit button when can_edit is absent', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).not.toContain('/edit"');
    });

    it('does not use mt-2 class on the edit button', function() {
      const c = { ...character, can_edit: true, is_pc: true, game_slug: 'demo', id: 7 };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('mt-2');
    });
  });
});
