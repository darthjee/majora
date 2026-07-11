import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';
import ActionsOverlay from '../../../../../../assets/js/components/elements/ActionsOverlay.jsx';
import { buildCharacter } from '../../../../../support/factories.js';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('CharacterHelper player slain/revive rendering', function() {
  const character = buildCharacter({
    name: 'Goblin Grunt',
    role: 'Minion',
    public_description: 'A lowly goblin.',
    is_pc: false,
  });

  describe('.render', function() {
    it('renders the player Mark as Slain button icon for a player who cannot edit', function() {
      const c = { ...character, can_edit: false, is_player: true, slain: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));

      expect(html).toContain('bi-skull-fill');
      expect(html).toContain('aria-label="Mark as Slain"');
      expect(html).toContain('title="Mark as Slain"');
    });

    it('renders the player Revive button icon for a currently slain NPC for a player who cannot edit', function() {
      const c = { ...character, can_edit: false, is_player: true, slain: true };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));

      expect(html).toContain('bi-heart-fill');
      expect(html).toContain('aria-label="Revive"');
      expect(html).toContain('title="Revive"');
    });

    it('renders only a single secondary button for a player who cannot edit', function() {
      const c = { ...character, can_edit: false, is_player: true, slain: false };
      const element = CharacterHelper.render(c, '#/games/demo/npcs');
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.secondaryButtons.length).toBe(1);
    });

    it('invokes onOpenPlayerSlainModal when the player slain/revive button is clicked', function() {
      const onOpenPlayerSlainModal = jasmine.createSpy('onOpenPlayerSlainModal');
      const c = { ...character, can_edit: false, is_player: true, slain: false };
      const element = CharacterHelper.render(c, '#/games/demo/npcs', { onOpenPlayerSlainModal });
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      overlay.props.secondaryButtons[0].onClick();

      expect(onOpenPlayerSlainModal).toHaveBeenCalled();
    });

    it('does not render the player button for a plain visitor (not a player, not an editor)', function() {
      const c = {
        ...character, can_edit: false, is_player: false, slain: false,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));

      expect(html).not.toContain('bi-skull');
    });

    it('does not render the player button for a PC, even when is_player is true', function() {
      const c = {
        ...character, is_pc: true, can_edit: false, is_player: true, slain: false,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));

      expect(html).not.toContain('bi-skull');
    });

    it('does not render the player button alongside the DM buttons when both can_edit and is_player are true', function() {
      const c = {
        ...character, can_edit: true, is_player: true, slain: false, public_slain: false,
      };
      const element = CharacterHelper.render(c, '#/games/demo/npcs');
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.secondaryButtons.length).toBe(2);
    });
  });
});
