import { renderToStaticMarkup } from 'react-dom/server';
import CharacterAvatarHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterAvatarHelper.jsx';
import { buildCharacter } from '../../../../../../../../support/factories.js';

describe('CharacterAvatarHelper', function() {
  describe('.render', function() {
    it('renders the default avatar when profile_photo_path is null', function() {
      const character = buildCharacter({ name: 'Aragorn' });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).toContain('default_character.png');
    });

    it('renders the profile photo when provided', function() {
      const character = buildCharacter({
        name: 'Aragorn', profile_photo_path: 'http://example.com/avatar.png',
      });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).toContain('http://example.com/avatar.png');
    });

    it('renders the upload overlay button when can_edit is true', function() {
      const character = buildCharacter({ name: 'Aragorn', can_edit: true });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).toContain('actions-overlay-button');
    });

    it('does not render the upload overlay button when can_edit is false', function() {
      const character = buildCharacter({ name: 'Aragorn', can_edit: false });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('does not wrap a PC picture in an allegiance border', function() {
      const character = buildCharacter({ name: 'Aragorn', is_pc: true, allegiance: 'enemy' });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).not.toContain('border-danger');
    });

    it('wraps an NPC picture in the allegiance border class', function() {
      const character = buildCharacter({ name: 'Goblin', is_pc: false, allegiance: 'enemy' });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).toContain('border-danger');
    });

    it('grants NPC upload access to a player without edit rights', function() {
      const character = buildCharacter({
        name: 'Goblin', is_pc: false, can_edit: false, is_player: true,
      });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).toContain('actions-overlay-button');
    });

    it('grants PC upload access to any player of the game without edit rights', function() {
      const character = buildCharacter({
        name: 'Aragorn', is_pc: true, can_edit: false, is_player: true,
      });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).toContain('actions-overlay-button');
    });

    it('grants PC upload access to staff without edit rights', function() {
      const character = buildCharacter({
        name: 'Aragorn', is_pc: true, can_edit: false, is_player: false, is_staff: true,
      });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).toContain('actions-overlay-button');
    });

    it('does not grant NPC upload access to staff without edit rights or player access', function() {
      const character = buildCharacter({
        name: 'Goblin', is_pc: false, can_edit: false, is_player: false, is_staff: true,
      });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('does not grant PC upload access when neither editor, player, nor staff', function() {
      const character = buildCharacter({
        name: 'Aragorn', is_pc: true, can_edit: false, is_player: false, is_staff: false,
      });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).not.toContain('actions-overlay-button');
    });

    it('renders the DM secondary slain/revive buttons for an editable NPC', function() {
      const character = buildCharacter({
        name: 'Goblin', is_pc: false, can_edit: true, slain: false, public_slain: false,
      });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).toContain('bi-skull-fill');
      expect(html).toContain('bi-skull"');
    });

    it('renders a single player-facing secondary button for a non-editor player', function() {
      const character = buildCharacter({
        name: 'Goblin', is_pc: false, can_edit: false, is_player: true, slain: false,
      });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).toContain('bi-skull-fill');
      expect(html).not.toContain('bi-skull"');
    });

    it('renders no secondary buttons for a PC', function() {
      const character = buildCharacter({ name: 'Aragorn', is_pc: true, can_edit: true });
      const html = renderToStaticMarkup(CharacterAvatarHelper.render(character, {}));
      expect(html).not.toContain('bi-skull');
    });
  });
});
