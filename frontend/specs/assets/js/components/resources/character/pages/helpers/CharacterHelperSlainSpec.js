import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import ActionsOverlay from '../../../../../../../../assets/js/components/common/ActionsOverlay.jsx';
import { buildCharacter } from '../../../../../../../support/factories.js';

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

  if (typeof node.type === 'function') {
    return findElement(node.type(node.props), matcher);
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
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.grayscale).toBe(true);
    });

    it('does not pass grayscale to the overlay when the character is not slain', function() {
      const c = { ...character, slain: false };
      const element = CharacterHelper.render(c, '#/games/demo/npcs');
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.grayscale).toBe(false);
    });

    it('renders the real Mark as Slain button icon for an NPC with edit rights', function() {
      // slain/public_slain deliberately differ, as they would in a real full-character
      // response, to guard against a regression that conflates the two fields.
      const c = { ...character, is_pc: false, can_edit: true, slain: false, public_slain: true };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));

      expect(html).toContain('bi-skull-fill');
      expect(html).toContain('aria-label="Mark as Slain"');
      expect(html).toContain('title="Mark as Slain"');
    });

    it('renders the real Revive button icon for a currently slain NPC with edit rights', function() {
      const c = { ...character, is_pc: false, can_edit: true, slain: true, public_slain: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));

      expect(html).toContain('bi-heart-fill');
      expect(html).toContain('aria-label="Revive"');
      expect(html).toContain('title="Revive"');
    });

    it('renders the public Mark as Publicly Slain button icon for an NPC with edit rights', function() {
      // slain is true while public_slain is false, mirroring a real DM-only response
      // where the two fields disagree — the public button must follow public_slain only.
      const c = { ...character, is_pc: false, can_edit: true, slain: true, public_slain: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));

      expect(html).toContain('bi-skull"');
      expect(html).toContain('aria-label="Mark as Publicly Slain"');
      expect(html).toContain('title="Mark as Publicly Slain"');
    });

    it('renders the public Publicly Revive button icon for a currently publicly slain NPC with edit rights', function() {
      const c = { ...character, is_pc: false, can_edit: true, slain: false, public_slain: true };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));

      expect(html).toContain('bi-heart"');
      expect(html).toContain('aria-label="Publicly Revive"');
      expect(html).toContain('title="Publicly Revive"');
    });

    it('does not render the slain/revive buttons for a PC even with edit rights', function() {
      const c = { ...character, is_pc: true, can_edit: true, slain: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));

      expect(html).not.toContain('bi-skull');
    });

    it('does not render the slain/revive buttons for an NPC without edit rights', function() {
      const c = { ...character, is_pc: false, can_edit: false, slain: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));

      expect(html).not.toContain('bi-skull');
    });

    it('invokes onOpenSlainModal when the real slain/revive button is clicked', function() {
      const onOpenSlainModal = jasmine.createSpy('onOpenSlainModal');
      const c = { ...character, is_pc: false, can_edit: true, slain: false };
      const element = CharacterHelper.render(c, '#/games/demo/npcs', { onOpenSlainModal });
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      overlay.props.secondaryButtons[0].onClick();

      expect(onOpenSlainModal).toHaveBeenCalled();
    });

    it('invokes onOpenPublicSlainModal when the public slain/revive button is clicked', function() {
      const onOpenPublicSlainModal = jasmine.createSpy('onOpenPublicSlainModal');
      const c = { ...character, is_pc: false, can_edit: true, public_slain: false };
      const element = CharacterHelper.render(c, '#/games/demo/npcs', { onOpenPublicSlainModal });
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      overlay.props.secondaryButtons[1].onClick();

      expect(onOpenPublicSlainModal).toHaveBeenCalled();
    });

    it('builds no secondary buttons for an NPC without edit rights', function() {
      const c = { ...character, is_pc: false, can_edit: false };
      const element = CharacterHelper.render(c, '#/games/demo/npcs');
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.secondaryButtons).toEqual([]);
    });
  });
});
