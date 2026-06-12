import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';

describe('CharacterHelper', function() {
  const character = {
    name: 'Aragorn',
    avatar_url: null,
    character_class: 'Ranger',
    level: 10,
    description: 'The future king of Gondor.',
    photos: [],
  };

  describe('.render', function() {
    it('renders the character name', function() {
      expect(renderToStaticMarkup(CharacterHelper.render(character))).toContain('Aragorn');
    });

    it('renders the character class', function() {
      expect(renderToStaticMarkup(CharacterHelper.render(character))).toContain('Ranger');
    });

    it('renders the character level', function() {
      expect(renderToStaticMarkup(CharacterHelper.render(character))).toContain('10');
    });

    it('renders the description', function() {
      expect(renderToStaticMarkup(CharacterHelper.render(character)))
        .toContain('The future king of Gondor.');
    });

    it('does not render description when empty', function() {
      const c = { ...character, description: '' };
      expect(renderToStaticMarkup(CharacterHelper.render(c))).not.toContain('The future king of Gondor.');
    });

    it('renders the default avatar when avatar_url is null', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character));
      expect(html).toContain('default_character.png');
    });

    it('renders photos when present', function() {
      const c = { ...character, photos: [{ id: 1, url: 'http://example.com/photo.png' }] };
      expect(renderToStaticMarkup(CharacterHelper.render(c)))
        .toContain('http://example.com/photo.png');
    });

    it('does not render photos section when photos are empty', function() {
      const html = renderToStaticMarkup(CharacterHelper.render(character));
      expect(html).not.toContain('http://example.com/photo.png');
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
