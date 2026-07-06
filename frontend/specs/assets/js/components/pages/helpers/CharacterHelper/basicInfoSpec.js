import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';
import { character } from './support.js';

describe('CharacterHelper', function() {
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
  });
});
