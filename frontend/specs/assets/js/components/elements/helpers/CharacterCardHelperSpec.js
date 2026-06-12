import { renderToStaticMarkup } from 'react-dom/server';
import CharacterCardHelper from '../../../../../../assets/js/components/elements/helpers/CharacterCardHelper.jsx';

describe('CharacterCardHelper', function() {
  const character = { id: 42, name: 'Aragorn', avatar_url: null };
  const gameSlug = 'epic-quest';

  describe('.render', function() {
    it('renders the character name', function() {
      expect(renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug)))
        .toContain('Aragorn');
    });

    it('links to the character detail page', function() {
      expect(renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug)))
        .toContain('href="#/games/epic-quest/characters/42"');
    });

    it('renders the default avatar when avatar_url is null', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug));
      expect(html).toContain('<img');
      expect(html).toContain('default_character.png');
    });

    it('renders the avatar image when avatar_url is provided', function() {
      const c = { ...character, avatar_url: 'http://example.com/aragorn.png' };
      const html = renderToStaticMarkup(CharacterCardHelper.render(c, gameSlug));
      expect(html).toContain('http://example.com/aragorn.png');
    });

    it('applies Bootstrap card classes', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug));
      expect(html).toContain('card');
      expect(html).toContain('card-body');
      expect(html).toContain('card-title');
    });
  });
});
