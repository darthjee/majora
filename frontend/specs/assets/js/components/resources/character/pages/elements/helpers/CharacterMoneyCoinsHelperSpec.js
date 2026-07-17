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

    it('does not render a treasure box when treasureValue is not given', function() {
      const html = renderToStaticMarkup(CharacterMoneyCoinsHelper.render(332));

      expect(html).not.toContain('coin-box-treasure');
    });

    it('does not render a treasure box when treasureValue is 0', function() {
      const html = renderToStaticMarkup(CharacterMoneyCoinsHelper.render(332, 0));

      expect(html).not.toContain('coin-box-treasure');
    });

    it('renders a bright-red treasure box for a 2000 treasureValue as "20 GP in Gems"', function() {
      const html = renderToStaticMarkup(CharacterMoneyCoinsHelper.render(332, 2000));

      expect(html).toContain('coin-box-treasure');
      expect(html).toContain('20 GP in Gems');
    });

    it('renders a cascading treasure box for a 2020 treasureValue as "2 SP | 20 GP in Gems"', function() {
      const html = renderToStaticMarkup(CharacterMoneyCoinsHelper.render(332, 2020));

      expect(html).toContain('coin-box-treasure');
      expect(html).toContain('2 SP | 20 GP in Gems');
    });
  });
});
