import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../assets/js/components/pages/helpers/CharacterHelper.jsx';
import { character } from './support.js';

describe('CharacterHelper', function() {
  describe('.render', function() {
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
});
