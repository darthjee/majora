import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import { character } from './support.js';

describe('CharacterHelper', function() {
  describe('.render', function() {
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

    it('preserves line breaks via remark-breaks', function() {
      const c = { ...character, private_description: 'Line one.\nLine two.' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('Line one.<br');
      expect(html).toContain('Line two.');
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
  });
});
