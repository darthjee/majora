import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';
import PhotoUploadOverlay from '../../../../../../assets/js/components/elements/PhotoUploadOverlay.jsx';
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

describe('CharacterHelper slain/revive rendering', function() {
  const character = buildCharacter({
    name: 'Aragorn',
    role: 'Ranger',
    public_description: 'The future king of Gondor.',
  });

  describe('.render', function() {
    it('passes grayscale to the overlay when the character is slain', function() {
      const c = { ...character, slain: true };
      const element = CharacterHelper.render(c, '#/games/demo/npcs');
      const overlay = findElement(element, (child) => child.type === PhotoUploadOverlay);

      expect(overlay.props.grayscale).toBe(true);
    });

    it('does not pass grayscale to the overlay when the character is not slain', function() {
      const c = { ...character, slain: false };
      const element = CharacterHelper.render(c, '#/games/demo/npcs');
      const overlay = findElement(element, (child) => child.type === PhotoUploadOverlay);

      expect(overlay.props.grayscale).toBe(false);
    });

    it('renders the Mark as Slain button icon for an NPC with edit rights', function() {
      const c = { ...character, is_pc: false, can_edit: true, slain: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));

      expect(html).toContain('bi-skull');
      expect(html).toContain('aria-label="Mark as Slain"');
      expect(html).toContain('title="Mark as Slain"');
    });

    it('renders the Revive button icon for a currently slain NPC with edit rights', function() {
      const c = { ...character, is_pc: false, can_edit: true, slain: true };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));

      expect(html).toContain('bi-heart-pulse-fill');
      expect(html).toContain('aria-label="Revive"');
      expect(html).toContain('title="Revive"');
    });

    it('does not render the slain/revive button for a PC even with edit rights', function() {
      const c = { ...character, is_pc: true, can_edit: true, slain: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));

      expect(html).not.toContain('bi-skull');
    });

    it('does not render the slain/revive button for an NPC without edit rights', function() {
      const c = { ...character, is_pc: false, can_edit: false, slain: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));

      expect(html).not.toContain('bi-skull');
    });

    it('invokes onOpenSlainModal when the slain/revive button is clicked', function() {
      const onOpenSlainModal = jasmine.createSpy('onOpenSlainModal');
      const c = { ...character, is_pc: false, can_edit: true, slain: false };
      const element = CharacterHelper.render(c, '#/games/demo/npcs', { onOpenSlainModal });
      const overlay = findElement(element, (child) => child.type === PhotoUploadOverlay);

      overlay.props.secondaryButton.onClick();

      expect(onOpenSlainModal).toHaveBeenCalled();
    });
  });
});
