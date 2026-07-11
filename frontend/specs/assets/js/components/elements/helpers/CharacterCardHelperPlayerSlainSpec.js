import { renderToStaticMarkup } from 'react-dom/server';
import CharacterCardHelper from '../../../../../../assets/js/components/elements/helpers/CharacterCardHelper.jsx';
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

describe('CharacterCardHelper player slain/revive rendering', function() {
  const character = buildCharacter({ id: 42, name: 'Aragorn' });
  const gameSlug = 'epic-quest';

  describe('.render', function() {
    it('renders the single player Mark as Slain button when isPlayer is true and canEdit is false', function() {
      const c = { ...character, slain: false };
      const html = renderToStaticMarkup(CharacterCardHelper.render(
        c, gameSlug, 'npc', 'normal', false,
        jasmine.createSpy('onUploadClick'), jasmine.createSpy('onSlainClick'), jasmine.createSpy('onPublicSlainClick'),
        { isPlayer: true },
      ));

      expect(html).toContain('bi-skull-fill');
      expect(html).toContain('aria-label="Mark as Slain"');
    });

    it('renders the single player Revive button when isPlayer is true, canEdit is false, and the NPC is slain', function() {
      const c = { ...character, slain: true };
      const html = renderToStaticMarkup(CharacterCardHelper.render(
        c, gameSlug, 'npc', 'normal', false,
        jasmine.createSpy('onUploadClick'), jasmine.createSpy('onSlainClick'), jasmine.createSpy('onPublicSlainClick'),
        { isPlayer: true },
      ));

      expect(html).toContain('bi-heart-fill');
      expect(html).toContain('aria-label="Revive"');
    });

    it('builds only one secondary button when isPlayer is true and canEdit is false', function() {
      const element = CharacterCardHelper.render(
        character, gameSlug, 'npc', 'normal', false,
        jasmine.createSpy('onUploadClick'), jasmine.createSpy('onSlainClick'), jasmine.createSpy('onPublicSlainClick'),
        { isPlayer: true },
      );
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.secondaryButtons.length).toBe(1);
    });

    it('does not render the player button for a plain visitor (isPlayer false, canEdit false)', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'npc', 'normal', false));

      expect(html).not.toContain('<button');
    });

    it('prevents navigation and calls onPlayerSlainClick with the character when the player button is clicked', function() {
      const onPlayerSlainClick = jasmine.createSpy('onPlayerSlainClick');
      const element = CharacterCardHelper.render(
        character, gameSlug, 'npc', 'normal', false,
        jasmine.createSpy('onUploadClick'), jasmine.createSpy('onSlainClick'), jasmine.createSpy('onPublicSlainClick'),
        { isPlayer: true, onPlayerSlainClick },
      );
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);
      const fakeEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };

      overlay.props.secondaryButtons[0].onClick(fakeEvent);

      expect(fakeEvent.preventDefault).toHaveBeenCalled();
      expect(fakeEvent.stopPropagation).toHaveBeenCalled();
      expect(onPlayerSlainClick).toHaveBeenCalledWith(character);
      expect(onPlayerSlainClick).toHaveBeenCalledTimes(1);
    });

    it('builds the DM pair of buttons, not the player button, when both canEdit and isPlayer are true', function() {
      const element = CharacterCardHelper.render(
        character, gameSlug, 'npc', 'normal', true,
        jasmine.createSpy('onUploadClick'), jasmine.createSpy('onSlainClick'), jasmine.createSpy('onPublicSlainClick'),
        { isPlayer: true },
      );
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.secondaryButtons.length).toBe(2);
    });
  });
});
