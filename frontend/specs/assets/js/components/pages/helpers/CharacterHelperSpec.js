import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';
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

describe('CharacterHelper', function() {
  const character = {
    name: 'Aragorn',
    profile_photo_path: null,
    role: 'Ranger',
    public_description: 'The future king of Gondor.',
    photos: [],
  };

  describe('.render', function() {
    it('renders the character name', function() {
      expect(renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'))).toContain('Aragorn');
    });

    it('renders the character role', function() {
      expect(renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'))).toContain('Ranger');
    });

    it('renders the character money breakdown', function() {
      const c = { ...character, money: 310 };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('20 CP');
      expect(html).toContain('29 SP');
    });

    it('does not render a money line when money is 0', function() {
      const c = { ...character, money: 0 };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('character-money');
    });

    it('renders the description', function() {
      expect(renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs')))
        .toContain('The future king of Gondor.');
    });

    it('renders the description with the text-pre-wrap class to preserve line breaks', function() {
      const c = { ...character, public_description: 'Line one.\nLine two.' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('text-pre-wrap');
      expect(html).toContain('Line one.\nLine two.');
    });

    it('does not render description when empty', function() {
      const c = { ...character, public_description: '' };
      expect(renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs')))
        .not.toContain('The future king of Gondor.');
    });

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
      expect(html).toContain('photo-upload-overlay-button');
    });

    it('does not render the photo upload overlay button when can_edit is false', function() {
      const c = { ...character, can_edit: false };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('photo-upload-overlay-button');
    });

    it('does not render the photo upload overlay button when can_edit is absent', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).not.toContain('photo-upload-overlay-button');
    });

    it('invokes onOpenUploadModal when the overlay button is clicked', function() {
      const onOpenUploadModal = jasmine.createSpy('onOpenUploadModal');
      const c = { ...character, can_edit: true };
      const element = CharacterHelper.render(c, '#/games/demo/pcs', { onOpenUploadModal });
      const overlay = findElement(element, (child) => child.type === PhotoUploadOverlay);

      overlay.props.onClick();

      expect(onOpenUploadModal).toHaveBeenCalled();
    });

    it('does not render a see all photos button at the bottom of the page', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: true };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('href="#/games/demo/pcs/7/photos"');
    });

    it('does not render the old inline photo gallery', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).not.toContain('img-fluid rounded');
    });

    it('renders a back button to the provided backHref', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs"');
    });

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

    it('does not use mt-2 class on the edit button', function() {
      const c = { ...character, can_edit: true, is_pc: true, game_slug: 'demo', id: 7 };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('mt-2');
    });

    it('renders the private description when present', function() {
      const c = { ...character, private_description: 'Secret DM notes.' };
      expect(renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs')))
        .toContain('Secret DM notes.');
    });

    it('renders the DM Notes label when private_description is present', function() {
      const c = { ...character, private_description: 'Secret DM notes.' };
      expect(renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs')))
        .toContain('DM Notes');
    });

    it('renders the private description with the text-pre-wrap class to preserve line breaks', function() {
      const c = { ...character, private_description: 'Line one.\nLine two.' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('text-pre-wrap');
      expect(html).toContain('Line one.\nLine two.');
    });

    it('does not render the DM Notes section when private_description is absent', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).not.toContain('DM Notes');
    });

    it('does not render the DM Notes section when private_description is empty', function() {
      const c = { ...character, private_description: '' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('DM Notes');
    });

    it('renders links when character.links contains items', function() {
      const c = { ...character, links: [{ text: 'Wiki', url: 'https://example.com/wiki' }] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="https://example.com/wiki"');
      expect(html).toContain('Wiki');
    });

    it('renders multiple links', function() {
      const c = {
        ...character,
        links: [
          { text: 'Wiki', url: 'https://example.com/wiki' },
          { text: 'Sheet', url: 'https://example.com/sheet' },
        ],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="https://example.com/wiki"');
      expect(html).toContain('href="https://example.com/sheet"');
    });

    it('does not render any link elements when character.links is empty', function() {
      const c = { ...character, links: [] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('<a href="http');
    });

    it('does not render any link elements when character.links is absent', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).not.toContain('<a href="http');
    });

    it('renders the name, links and money inside the left column, and role/description in the right column', function() {
      const c = {
        ...character,
        links: [{ text: 'Wiki', url: 'https://example.com/wiki' }],
        money: 310,
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      const leftColStart = html.indexOf('class="col-md-4"');
      const rightColStart = html.indexOf('class="col-md-8"');
      const nameIndex = html.indexOf('Aragorn');
      const linkIndex = html.indexOf('href="https://example.com/wiki"');
      const moneyIndex = html.indexOf('20 CP');
      const roleIndex = html.indexOf('Ranger');

      expect(leftColStart).toBeGreaterThan(-1);
      expect(rightColStart).toBeGreaterThan(leftColStart);
      expect(nameIndex).toBeGreaterThan(leftColStart);
      expect(nameIndex).toBeLessThan(rightColStart);
      expect(linkIndex).toBeGreaterThan(leftColStart);
      expect(linkIndex).toBeLessThan(rightColStart);
      expect(moneyIndex).toBeGreaterThan(leftColStart);
      expect(moneyIndex).toBeLessThan(rightColStart);
      expect(roleIndex).toBeGreaterThan(rightColStart);
    });
  });

  describe('treasures preview section', function() {
    it('renders the heading and each treasure card with a quantity badge, defaulting to an empty list', function() {
      const withTreasures = {
        ...character,
        treasures: [{ id: 1, treasure_id: 9, name: 'Potion of Healing', quantity: 3, value: 50 }],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(withTreasures, '#/games/demo/pcs'));
      expect(html).toContain('Treasures');
      expect(html).toContain('Potion of Healing');
      expect(html).toContain('href="#/treasures/9"');
      expect(html).toContain('×3');
      expect(renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'))).toContain('Treasures');
    });

    it('does not render a quantity badge when the treasure quantity is 1', function() {
      const withTreasures = {
        ...character,
        treasures: [{ id: 1, treasure_id: 9, name: 'Potion of Healing', quantity: 1, value: 50 }],
      };
      const html = renderToStaticMarkup(CharacterHelper.render(withTreasures, '#/games/demo/pcs'));
      expect(html).not.toContain('×1');
    });

    it('renders a see all link to the pcs treasures page', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: true, treasures: [] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/treasures"');
    });

    it('renders a see all link to the npcs treasures page', function() {
      const c = { ...character, game_slug: 'demo', id: 7, is_pc: false, treasures: [] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('href="#/games/demo/npcs/7/treasures"');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(CharacterHelper.renderLoading())).toContain('Loading character');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(CharacterHelper.renderError('Not found'));
      expect(html).toContain('Not found');
      expect(html).toContain('alert');
    });
  });
});
