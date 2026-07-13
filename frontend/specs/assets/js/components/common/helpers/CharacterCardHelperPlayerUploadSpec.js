import { renderToStaticMarkup } from 'react-dom/server';
import CharacterCardHelper from '../../../../../../assets/js/components/common/helpers/CharacterCardHelper.jsx';
import ActionsOverlay from '../../../../../../assets/js/components/common/ActionsOverlay.jsx';
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

describe('CharacterCardHelper player upload rendering', function() {
  const character = buildCharacter({ id: 42, name: 'Aragorn' });
  const gameSlug = 'epic-quest';

  describe('.render', function() {
    it('grants the upload button to a player who is not an editor, without the DM-only secondary buttons', function() {
      const element = CharacterCardHelper.render(
        character, gameSlug, 'npc', 'normal', false,
        jasmine.createSpy('onUploadClick'), jasmine.createSpy('onSlainClick'), jasmine.createSpy('onPublicSlainClick'),
        { isPlayer: true },
      );
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.canEdit).toBe(true);
      expect(overlay.props.secondaryButtons.length).toBe(1);
    });

    it('still grants the upload button to an editor (regression guard)', function() {
      const element = CharacterCardHelper.render(character, gameSlug, 'npc', 'normal', true);
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.canEdit).toBe(true);
    });

    it('does not grant the upload button or any secondary button to a plain visitor', function() {
      const element = CharacterCardHelper.render(
        character, gameSlug, 'npc', 'normal', false,
        jasmine.createSpy('onUploadClick'), jasmine.createSpy('onSlainClick'), jasmine.createSpy('onPublicSlainClick'),
        { isPlayer: false },
      );
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.canEdit).toBe(false);
      expect(overlay.props.secondaryButtons).toEqual([]);
    });

    it('does not add an upload button to a PC card even when isPlayer is true', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(
        character, gameSlug, 'pc', 'normal', false,
        jasmine.createSpy('onUploadClick'), jasmine.createSpy('onSlainClick'), jasmine.createSpy('onPublicSlainClick'),
        { isPlayer: true },
      ));

      expect(html).not.toContain('<button');
    });
  });
});
