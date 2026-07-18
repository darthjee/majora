import { renderToStaticMarkup } from 'react-dom/server';
import CharacterMoneyTreasureBillHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyTreasureBillHelper.jsx';
import Icons from '../../../../../../../../../assets/js/utils/ui/Icons.js';

describe('CharacterMoneyTreasureBillHelper', function() {
  describe('.render', function() {
    it('returns null when treasureValue is 0', function() {
      expect(CharacterMoneyTreasureBillHelper.render(0)).toBeNull();
    });

    it('returns null when treasureValue is not given', function() {
      expect(CharacterMoneyTreasureBillHelper.render()).toBeNull();
    });

    it('renders "$ 100,02 in Gems" for a treasureValue of 10002 cents', function() {
      const html = renderToStaticMarkup(CharacterMoneyTreasureBillHelper.render(10002));

      expect(html).toContain('character-money-bill');
      expect(html).toContain('character-money-bill-treasure');
      expect(html).toContain('$');
      expect(html).toContain('100,02');
      expect(html).toContain('in Gems');
    });

    it('zero-pads cents the same way as the regular money bill', function() {
      const html = renderToStaticMarkup(CharacterMoneyTreasureBillHelper.render(10000));

      expect(html).toContain('100,00');
    });

    it('uses the bi-gem icon instead of the coin-icon class', function() {
      const html = renderToStaticMarkup(CharacterMoneyTreasureBillHelper.render(350));

      expect(html).toContain(Icons.gem);
      expect(html).not.toContain('coin-icon');
    });
  });
});
