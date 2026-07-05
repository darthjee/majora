import { renderToStaticMarkup } from 'react-dom/server';
import CharacterCardHelper from '../../../../../../assets/js/components/elements/helpers/CharacterCardHelper.jsx';
import PhotoUploadOverlay from '../../../../../../assets/js/components/elements/PhotoUploadOverlay.jsx';

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
  const character = { id: 42, name: 'Aragorn', profile_photo_path: null };
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

    it('renders the photo via PhotoUploadOverlay for NPCs', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'npc'));
      expect(html).toContain('card-photo-square');
    });

    it('applies grayscale for a slain NPC', function() {
      const c = { ...character, slain: true };
      const element = CharacterCardHelper.render(c, gameSlug, 'npc');
      const overlay = findElement(element, (child) => child.type === PhotoUploadOverlay);

      expect(overlay.props.grayscale).toBe(true);
    });

    it('does not render overlay buttons for NPCs when canEdit is false', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'npc', 'normal', false));
      expect(html).not.toContain('<button');
    });

    it('renders the Mark as Slain button for NPCs when canEdit is true and not slain', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'npc', 'normal', true));
      expect(html).toContain('Mark as Slain');
    });

    it('renders the Revive button for NPCs when canEdit is true and slain', function() {
      const c = { ...character, slain: true };
      const html = renderToStaticMarkup(CharacterCardHelper.render(c, gameSlug, 'npc', 'normal', true));
      expect(html).toContain('Revive');
    });

    it('prevents navigation and calls onUploadClick with the character when the upload button is clicked', function() {
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const element = CharacterCardHelper.render(character, gameSlug, 'npc', 'normal', true, onUploadClick);
      const overlay = findElement(element, (child) => child.type === PhotoUploadOverlay);
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

    it('prevents navigation and calls onSlainClick with the character when the slain button is clicked', function() {
      const onSlainClick = jasmine.createSpy('onSlainClick');
      const element = CharacterCardHelper.render(
        character, gameSlug, 'npc', 'normal', true, jasmine.createSpy('onUploadClick'), onSlainClick,
      );
      const overlay = findElement(element, (child) => child.type === PhotoUploadOverlay);
      const fakeEvent = {
        preventDefault: jasmine.createSpy('preventDefault'),
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };

      overlay.props.secondaryButton.onClick(fakeEvent);

      expect(fakeEvent.preventDefault).toHaveBeenCalled();
      expect(fakeEvent.stopPropagation).toHaveBeenCalled();
      expect(onSlainClick).toHaveBeenCalledWith(character);
      expect(onSlainClick).toHaveBeenCalledTimes(1);
    });
  });
});
