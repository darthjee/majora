import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import { buildLink } from '../../../../../../../../support/factories.js';
import { character } from './support.js';

describe('CharacterHelper', function() {
  describe('.render', function() {
    it('renders links when character.links contains items', function() {
      const c = { ...character, links: [buildLink({ text: 'Wiki', url: 'https://example.com/wiki' })] };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('href="https://example.com/wiki"');
      expect(html).toContain('Wiki');
    });

    it('renders multiple links', function() {
      const c = {
        ...character,
        links: [
          buildLink({ text: 'Wiki', url: 'https://example.com/wiki' }),
          buildLink({ id: 2, text: 'Sheet', url: 'https://example.com/sheet' }),
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
});
