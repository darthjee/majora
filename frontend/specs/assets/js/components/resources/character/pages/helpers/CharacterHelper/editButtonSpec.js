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

    it('renders an npcs edit button for a player editor when can_edit is false', function() {
      const c = {
        ...character, can_edit: false, is_player: true, is_pc: false, game_slug: 'demo', id: 7,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('href="#/games/demo/npcs/7/edit"');
      expect(html).toContain('Edit');
    });

    it('renders a pcs edit button for a player when can_edit is false', function() {
      const c = {
        ...character, can_edit: false, is_player: true, is_pc: true, game_slug: 'demo', id: 7,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/edit"');
      expect(html).toContain('Edit');
    });

    it('renders a pcs edit button for a staff account even when is_player is false', function() {
      const c = {
        ...character, can_edit: false, is_player: false, is_pc: true, is_staff: true, game_slug: 'demo', id: 7,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/edit"');
      expect(html).toContain('Edit');
    });

    it('does not render a pcs edit button for neither a player nor a staff account', function() {
      const c = {
        ...character, can_edit: false, is_player: false, is_pc: true, is_staff: false, game_slug: 'demo', id: 7,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('/edit"');
    });

    it('does not use mt-2 class on the edit button', function() {
      const c = { ...character, can_edit: true, is_pc: true, game_slug: 'demo', id: 7 };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('mt-2');
    });
  });
});
