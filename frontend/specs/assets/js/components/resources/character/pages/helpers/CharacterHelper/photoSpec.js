import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import ActionsOverlay from '../../../../../../../../../assets/js/components/common/ActionsOverlay.jsx';
import InfoBarRules from '../../../../../../../../../assets/js/components/common/helpers/InfoBarRules.js';
import { character, findElement } from './support.js';

describe('CharacterHelper', function() {
  describe('.render', function() {
    it('renders the default avatar when profile_photo_path is null', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).toContain('default_character.png');
    });

    it('renders the profile photo when profile_photo_path is provided', function() {
      const c = {
        ...character,
        profile_photo_path: 'http://example.com/profile_photo.png',
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('http://example.com/profile_photo.png');
    });

    it('renders the photo upload overlay button when can_edit is true', function() {
      const c = { ...character, can_edit: true };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('actions-overlay-button');
    });

    it('does not render the photo upload overlay button when can_edit is false', function() {
      const c = { ...character, can_edit: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('does not render the photo upload overlay button when can_edit is absent', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('invokes onOpenUploadModal when the overlay button is clicked', function() {
      const onOpenUploadModal = jasmine.createSpy('onOpenUploadModal');
      const c = { ...character, can_edit: true };
      const element = CharacterHelper.render(c, '#/games/demo/pcs', { onOpenUploadModal });
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      overlay.props.onClick();

      expect(onOpenUploadModal).toHaveBeenCalled();
    });

    it('renders the photo upload overlay button for an NPC when is_player is true, even without can_edit', function() {
      const c = {
        ...character, is_pc: false, can_edit: false, is_player: true,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('actions-overlay-button');
    });

    it('still renders the photo upload overlay button for an NPC editor, unaffected by is_player', function() {
      const c = {
        ...character, is_pc: false, can_edit: true, is_player: false,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('actions-overlay-button');
    });

    it('does not render the photo upload overlay button for a plain visitor (not a player, not an editor)', function() {
      const c = {
        ...character, is_pc: false, can_edit: false, is_player: false,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders the photo upload overlay button for a PC when is_player is true, even without can_edit', function() {
      const c = {
        ...character, is_pc: true, can_edit: false, is_player: true,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('actions-overlay-button');
    });

    it('renders the photo upload overlay button for a PC when is_staff is true, even without can_edit or is_player', function() {
      const c = {
        ...character, is_pc: true, can_edit: false, is_player: false, is_staff: true,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('actions-overlay-button');
    });

    it('does not render the photo upload overlay button for a PC when neither an editor, player, nor staff', function() {
      const c = {
        ...character, is_pc: true, can_edit: false, is_player: false, is_staff: false,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('does not render the "New NPC"/edit-link button for a player who is not an editor', function() {
      const c = {
        ...character, is_pc: false, can_edit: false, is_player: true,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).not.toContain('character_page.edit');
    });

    it('threads InfoBarRules.build(character) as infoBarItems to the picture overlay', function() {
      const element = CharacterHelper.render(character, '#/games/demo/pcs');
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.infoBarItems).toEqual(InfoBarRules.build(character));
    });
  });
});
