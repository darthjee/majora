import { renderToStaticMarkup } from 'react-dom/server';
import CharacterCardHelper from '../../../../../../assets/js/components/common/helpers/CharacterCardHelper.jsx';
import ActionsOverlay from '../../../../../../assets/js/components/common/ActionsOverlay.jsx';
import InfoBar from '../../../../../../assets/js/components/common/InfoBar.jsx';
import InfoBarRules from '../../../../../../assets/js/components/common/helpers/InfoBarRules.js';
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

describe('CharacterCardHelper', function() {
  const character = buildCharacter({ id: 42, name: 'Aragorn' });
  const gameSlug = 'epic-quest';

  describe('.render', function() {
    it('renders the character name', function() {
      expect(renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'pc')))
        .toContain('Aragorn');
    });

    it('links to the pc character detail page when characterType is pc', function() {
      expect(renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'pc')))
        .toContain('href="#/games/epic-quest/pcs/42"');
    });

    it('links to the npc character detail page when characterType is npc', function() {
      expect(renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'npc')))
        .toContain('href="#/games/epic-quest/npcs/42"');
    });

    it('renders the default avatar when profile_photo_path is null', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'pc'));
      expect(html).toContain('<img');
      expect(html).toContain('default_character.png');
    });

    it('renders the avatar image when profile_photo_path is provided', function() {
      const c = { ...character, profile_photo_path: 'http://example.com/aragorn.png' };
      const html = renderToStaticMarkup(CharacterCardHelper.render(c, gameSlug, 'pc'));
      expect(html).toContain('http://example.com/aragorn.png');
    });

    it('applies Bootstrap card classes', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'pc'));
      expect(html).toContain('card');
      expect(html).toContain('card-body');
      expect(html).toContain('card-title');
    });

    it('uses the normal column classes and h5 heading by default', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'pc'));
      expect(html).toContain('col-sm-6 col-md-4 col-lg-3');
      expect(html).toContain('<h5');
    });

    it('uses smaller column classes when size is small', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'pc', 'small'));
      expect(html).toContain('col-sm-3 col-md-2 col-lg-1');
    });

    it('does not render the visible character name when size is small', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'pc', 'small'));
      expect(html).not.toContain('card-title');
      expect(html).not.toContain('>Aragorn<');
    });

    it('keeps the character name as the image alt text when size is small', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'pc', 'small'));
      expect(html).toContain('alt="Aragorn"');
    });

    it('renders a plain avatar for PCs, ignoring canEdit', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'pc', 'normal', true));
      expect(html).not.toContain('<button');
    });

    it('renders the photo via ActionsOverlay for NPCs', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'npc'));
      expect(html).toContain('card-photo-square');
    });

    it('applies grayscale for a slain NPC', function() {
      const c = { ...character, slain: true };
      const element = CharacterCardHelper.render(c, gameSlug, 'npc');
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.grayscale).toBe(true);
    });

    it('applies dimmed for a hidden NPC', function() {
      const c = { ...character, hidden: true };
      const element = CharacterCardHelper.render(c, gameSlug, 'npc');
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.dimmed).toBe(true);
    });

    it('does not apply dimmed for a non-hidden NPC', function() {
      const element = CharacterCardHelper.render(character, gameSlug, 'npc');
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.dimmed).toBeFalsy();
    });

    it('does not render overlay buttons for NPCs when canEdit is false', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'npc', 'normal', false));
      expect(html).not.toContain('<button');
    });

    it('renders the real Mark as Slain button icon for NPCs when canEdit is true and not slain', function() {
      // slain/public_slain deliberately differ, as they would in a real full-character
      // response, to guard against a regression that conflates the two fields.
      const c = { ...character, slain: false, public_slain: true };
      const html = renderToStaticMarkup(CharacterCardHelper.render(c, gameSlug, 'npc', 'normal', true));
      expect(html).toContain('bi-skull-fill');
      expect(html).toContain('aria-label="Mark as Slain"');
      expect(html).toContain('title="Mark as Slain"');
    });

    it('renders the real Revive button icon for NPCs when canEdit is true and slain', function() {
      const c = { ...character, slain: true, public_slain: false };
      const html = renderToStaticMarkup(CharacterCardHelper.render(c, gameSlug, 'npc', 'normal', true));
      expect(html).toContain('bi-heart-fill');
      expect(html).toContain('aria-label="Revive"');
      expect(html).toContain('title="Revive"');
    });

    it('renders the public Mark as Publicly Slain button icon for NPCs when canEdit is true and not public_slain', function() {
      // slain is true while public_slain is false, mirroring a real DM-only response
      // where the two fields disagree — the public button must follow public_slain only.
      const c = { ...character, slain: true, public_slain: false };
      const html = renderToStaticMarkup(CharacterCardHelper.render(c, gameSlug, 'npc', 'normal', true));
      expect(html).toContain('bi-skull"');
      expect(html).toContain('aria-label="Mark as Publicly Slain"');
      expect(html).toContain('title="Mark as Publicly Slain"');
    });

    it('renders the public Publicly Revive button icon for NPCs when canEdit is true and public_slain', function() {
      const c = { ...character, slain: false, public_slain: true };
      const html = renderToStaticMarkup(CharacterCardHelper.render(c, gameSlug, 'npc', 'normal', true));
      expect(html).toContain('bi-heart"');
      expect(html).toContain('aria-label="Publicly Revive"');
      expect(html).toContain('title="Publicly Revive"');
    });

    it('prevents navigation and calls onUploadClick with the character when the upload button is clicked', function() {
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const element = CharacterCardHelper.render(character, gameSlug, 'npc', 'normal', true, onUploadClick);
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);
      const fakeEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };

      overlay.props.onClick(fakeEvent);

      expect(fakeEvent.preventDefault).toHaveBeenCalled();
      expect(fakeEvent.stopPropagation).toHaveBeenCalled();
      expect(onUploadClick).toHaveBeenCalledWith(character);
      expect(onUploadClick).toHaveBeenCalledTimes(1);
    });

    it('applies the green border class for an allied NPC', function() {
      const c = { ...character, allegiance: 'ally' };
      const html = renderToStaticMarkup(CharacterCardHelper.render(c, gameSlug, 'npc'));
      expect(html).toContain('border-success');
    });

    it('applies the red border class for an enemy NPC', function() {
      const c = { ...character, allegiance: 'enemy' };
      const html = renderToStaticMarkup(CharacterCardHelper.render(c, gameSlug, 'npc'));
      expect(html).toContain('border-danger');
    });

    it('applies the gray border class for a neutral NPC', function() {
      const c = { ...character, allegiance: 'neutral' };
      const html = renderToStaticMarkup(CharacterCardHelper.render(c, gameSlug, 'npc'));
      expect(html).toContain('border-secondary');
    });

    it('applies the gray border class for an NPC with a missing allegiance', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'npc'));
      expect(html).toContain('border-secondary');
    });

    it('does not apply any border class for a PC, regardless of allegiance', function() {
      const c = { ...character, allegiance: 'enemy' };
      const html = renderToStaticMarkup(CharacterCardHelper.render(c, gameSlug, 'pc'));
      expect(html).not.toContain('border-success');
      expect(html).not.toContain('border-danger');
      expect(html).not.toContain('border-secondary');
    });

    it('prevents navigation and calls onSlainClick with the character when the real slain button is clicked', function() {
      const onSlainClick = jasmine.createSpy('onSlainClick');
      const element = CharacterCardHelper.render(
        character, gameSlug, 'npc', 'normal', true, jasmine.createSpy('onUploadClick'), onSlainClick,
      );
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);
      const fakeEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };

      overlay.props.secondaryButtons[0].onClick(fakeEvent);

      expect(fakeEvent.preventDefault).toHaveBeenCalled();
      expect(fakeEvent.stopPropagation).toHaveBeenCalled();
      expect(onSlainClick).toHaveBeenCalledWith(character);
      expect(onSlainClick).toHaveBeenCalledTimes(1);
    });

    it('prevents navigation and calls onPublicSlainClick with the character when the public slain button is clicked', function() {
      const onPublicSlainClick = jasmine.createSpy('onPublicSlainClick');
      const element = CharacterCardHelper.render(
        character, gameSlug, 'npc', 'normal', true,
        jasmine.createSpy('onUploadClick'), jasmine.createSpy('onSlainClick'), onPublicSlainClick,
      );
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);
      const fakeEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };

      overlay.props.secondaryButtons[1].onClick(fakeEvent);

      expect(fakeEvent.preventDefault).toHaveBeenCalled();
      expect(fakeEvent.stopPropagation).toHaveBeenCalled();
      expect(onPublicSlainClick).toHaveBeenCalledWith(character);
      expect(onPublicSlainClick).toHaveBeenCalledTimes(1);
    });

    it('builds no secondary buttons for NPCs when canEdit is false', function() {
      const element = CharacterCardHelper.render(character, gameSlug, 'npc', 'normal', false);
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.secondaryButtons).toEqual([]);
    });

    it('threads InfoBarRules.build(character) as infoBarItems for NPCs', function() {
      const element = CharacterCardHelper.render(character, gameSlug, 'npc');
      const overlay = findElement(element, (child) => child.type === ActionsOverlay);

      expect(overlay.props.infoBarItems).toEqual(InfoBarRules.build(character));
    });

    it('renders an InfoBar with InfoBarRules.build(character) items for PCs', function() {
      const element = CharacterCardHelper.render(character, gameSlug, 'pc');
      const infoBar = findElement(element, (child) => child.type === InfoBar);

      expect(infoBar.props.items).toEqual(InfoBarRules.build(character));
    });
  });
});
