import { renderToStaticMarkup } from 'react-dom/server';
import CharacterCardHelper from '../../../../../../assets/js/components/elements/helpers/CharacterCardHelper.jsx';

describe('CharacterCardHelper', function() {
  const character = { id: 42, name: 'Aragorn', avatar_url: null };
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

    it('renders the default avatar when avatar_url is null', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'pc'));
      expect(html).toContain('<img');
      expect(html).toContain('default_character.png');
    });

    it('renders the avatar image when avatar_url is provided', function() {
      const c = { ...character, avatar_url: 'http://example.com/aragorn.png' };
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

    it('uses smaller column classes and h6 heading when size is small', function() {
      const html = renderToStaticMarkup(CharacterCardHelper.render(character, gameSlug, 'pc', 'small'));
      expect(html).toContain('col-sm-4 col-md-3 col-lg-2');
      expect(html).toContain('<h6');
    });
  });
});
