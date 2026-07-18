import { renderToStaticMarkup } from 'react-dom/server';
import CharacterMoneyBillHelper from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyBillHelper.jsx';
import Icons from '../../../../../../../../../assets/js/utils/ui/Icons.js';

describe('CharacterMoneyBillHelper', function() {
  describe('.render', function() {
    it('renders 10002 cents as 100,02', function() {
      const html = renderToStaticMarkup(CharacterMoneyBillHelper.render(10002));

      expect(html).toContain('character-money-bill-group');
      expect(html).toContain('character-money-bill');
      expect(html).toContain('$');
      expect(html).toContain('100,02');
    });

    it('renders 10000 cents as 100,00', function() {
      const html = renderToStaticMarkup(CharacterMoneyBillHelper.render(10000));

      expect(html).toContain('100,00');
    });

    it('renders 10010 cents as 100,10', function() {
      const html = renderToStaticMarkup(CharacterMoneyBillHelper.render(10010));

      expect(html).toContain('100,10');
    });

    it('always renders the bill box, even when money is 0', function() {
      const html = renderToStaticMarkup(CharacterMoneyBillHelper.render(0));

      expect(html).toContain('character-money-bill');
      expect(html).toContain('0,00');
    });

    it('uses the bi-cash-coin icon', function() {
      const html = renderToStaticMarkup(CharacterMoneyBillHelper.render(350));

      expect(html).toContain(Icons.cashCoin);
      expect(html).not.toContain('coin-icon');
    });

    it('does not render a treasure box when treasureValue is not given', function() {
      const html = renderToStaticMarkup(CharacterMoneyBillHelper.render(350));

      expect(html).not.toContain('character-money-bill-treasure');
    });

    it('does not render a treasure box when treasureValue is 0', function() {
      const html = renderToStaticMarkup(CharacterMoneyBillHelper.render(350, 0));

      expect(html).not.toContain('character-money-bill-treasure');
    });

    it('renders a gold treasure box below the money box for a non-zero treasureValue', function() {
      const html = renderToStaticMarkup(CharacterMoneyBillHelper.render(350, 10002));

      expect(html).toContain('character-money-bill-treasure');
      expect(html).toContain('100,02');
      expect(html).toContain('in Gems');
    });

    it('wraps the money bill and treasure bill in a shared character-money-bill-group container', function() {
      const html = renderToStaticMarkup(CharacterMoneyBillHelper.render(350, 10002));
      const groupIndex = html.indexOf('character-money-bill-group');
      const billIndex = html.indexOf('character-money-bill"');
      const treasureIndex = html.indexOf('character-money-bill-treasure');

      expect(groupIndex).toBeGreaterThan(-1);
      expect(groupIndex).toBeLessThan(billIndex);
      expect(groupIndex).toBeLessThan(treasureIndex);
    });
  });
});
