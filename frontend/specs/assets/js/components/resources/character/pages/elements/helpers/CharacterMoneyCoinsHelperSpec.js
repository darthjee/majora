import { renderToStaticMarkup } from 'react-dom/server';
import CharacterMoneyCoinsHelper from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyCoinsHelper.jsx';

describe('CharacterMoneyCoinsHelper', function() {
  describe('.render', function() {
    it('renders all four coin boxes in cp/sp/gp/pp order', function() {
      const html = renderToStaticMarkup(CharacterMoneyCoinsHelper.render(332));
      const cpIndex = html.indexOf('coin-box-cp');
      const spIndex = html.indexOf('coin-box-sp');
      const gpIndex = html.indexOf('coin-box-gp');
      const ppIndex = html.indexOf('coin-box-pp');

      expect(cpIndex).toBeGreaterThan(-1);
      expect(cpIndex).toBeLessThan(spIndex);
      expect(spIndex).toBeLessThan(gpIndex);
      expect(gpIndex).toBeLessThan(ppIndex);
    });

    it('keeps zero-quantity denominations visible', function() {
      const html = renderToStaticMarkup(CharacterMoneyCoinsHelper.render(0));

      expect(html).toContain('coin-box-cp');
      expect(html).toContain('coin-box-sp');
      expect(html).toContain('coin-box-gp');
      expect(html).toContain('coin-box-pp');
      expect(html).toContain('>0<');
    });

    it('lets platinum absorb all remaining value instead of overflowing into gems', function() {
      const html = renderToStaticMarkup(CharacterMoneyCoinsHelper.render(32220));

      expect(html).not.toContain('gems');
      expect(html).toContain('30');
    });
  });
});
