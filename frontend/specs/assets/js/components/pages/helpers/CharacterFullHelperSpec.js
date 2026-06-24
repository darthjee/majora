import { renderToStaticMarkup } from 'react-dom/server';
import CharacterFullHelper from '../../../../../../assets/js/components/pages/helpers/CharacterFullHelper.jsx';

describe('CharacterFullHelper', function() {
  const character = {
    name: 'Aragorn',
    avatar_url: null,
    character_class: 'Ranger',
    level: 10,
    public_description: 'The future king of Gondor.',
    private_description: 'Has the ring of Barahir.',
    photos: [],
  };

  describe('.render', function() {
    it('renders the character name', function() {
      expect(renderToStaticMarkup(CharacterFullHelper.render(character, '#/games/demo/pcs'))).toContain('Aragorn');
    });

    it('renders the character class', function() {
      expect(renderToStaticMarkup(CharacterFullHelper.render(character, '#/games/demo/pcs'))).toContain('Ranger');
    });

    it('renders the public description', function() {
      expect(renderToStaticMarkup(CharacterFullHelper.render(character, '#/games/demo/pcs')))
        .toContain('The future king of Gondor.');
    });

    it('renders the private description when present', function() {
      expect(renderToStaticMarkup(CharacterFullHelper.render(character, '#/games/demo/pcs')))
        .toContain('Has the ring of Barahir.');
    });

    it('renders the DM Notes label when private_description is present', function() {
      expect(renderToStaticMarkup(CharacterFullHelper.render(character, '#/games/demo/pcs')))
        .toContain('DM Notes');
    });

    it('does not render the DM Notes section when private_description is empty', function() {
      const c = { ...character, private_description: '' };
      const html = renderToStaticMarkup(CharacterFullHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('DM Notes');
    });

    it('does not render the DM Notes section when private_description is absent', function() {
      const c = { ...character, private_description: null };
      const html = renderToStaticMarkup(CharacterFullHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('DM Notes');
    });

    it('renders a back button to the provided backHref', function() {
      const html = renderToStaticMarkup(CharacterFullHelper.render(character, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs"');
    });

    it('renders a pcs edit button when can_edit is true and is_pc is true', function() {
      const c = { ...character, can_edit: true, is_pc: true, game_slug: 'demo', id: 7 };
      const html = renderToStaticMarkup(CharacterFullHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="#/games/demo/pcs/7/edit"');
    });

    it('renders an npcs edit button when can_edit is true and is_pc is false', function() {
      const c = { ...character, can_edit: true, is_pc: false, game_slug: 'demo', id: 7 };
      const html = renderToStaticMarkup(CharacterFullHelper.render(c, '#/games/demo/npcs'));
      expect(html).toContain('href="#/games/demo/npcs/7/edit"');
    });

    it('does not render an edit button when can_edit is false', function() {
      const c = { ...character, can_edit: false };
      const html = renderToStaticMarkup(CharacterFullHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('/edit"');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(CharacterFullHelper.renderLoading())).toContain('Loading character');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(CharacterFullHelper.renderError('Not found'));
      expect(html).toContain('Not found');
      expect(html).toContain('alert');
    });
  });
});
