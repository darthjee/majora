import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';

describe('CharacterHelper', function() {
  const character = {
    name: 'Aragorn',
    avatar_url: null,
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

    it('renders the description', function() {
      expect(renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs')))
        .toContain('The future king of Gondor.');
    });

    it('does not render description when empty', function() {
      const c = { ...character, public_description: '' };
      expect(renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs')))
        .not.toContain('The future king of Gondor.');
    });

    it('renders the default avatar when avatar_url is null', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).toContain('default_character.png');
    });

    it('renders photos when present', function() {
      const c = { ...character, photos: [{ id: 1, url: 'http://example.com/photo.png' }] };
      expect(renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs')))
        .toContain('http://example.com/photo.png');
    });

    it('does not render photos section when photos are empty', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character, '#/games/demo/pcs'));
      expect(html).not.toContain('http://example.com/photo.png');
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
