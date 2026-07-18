import { renderToStaticMarkup } from 'react-dom/server';
import CharacterMoneyTreasureBoxHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterMoneyTreasureBoxHelper.jsx';
import Icons from '../../../../../../../../../assets/js/utils/ui/Icons.js';

describe('CharacterMoneyTreasureBoxHelper', function() {
  describe('.render', function() {
    it('returns null when treasureValue is 0', function() {
      expect(CharacterMoneyTreasureBoxHelper.render(0)).toBeNull();
    });

    it('returns null when treasureValue is not given', function() {
      expect(CharacterMoneyTreasureBoxHelper.render()).toBeNull();
    });

    it('renders "20 GP in Gems" for a treasureValue of 2000', function() {
      const html = renderToStaticMarkup(CharacterMoneyTreasureBoxHelper.render(2000));

      expect(html).toContain('coin-box');
      expect(html).toContain('coin-box-treasure');
      expect(html).toContain('20 GP in Gems');
    });

    it('renders "2 SP | 20 GP in Gems" for a treasureValue of 2020', function() {
      const html = renderToStaticMarkup(CharacterMoneyTreasureBoxHelper.render(2020));

      expect(html).toContain('2 SP | 20 GP in Gems');
    });

    it('uses the bi-gem icon instead of the coin-icon class', function() {
      const html = renderToStaticMarkup(CharacterMoneyTreasureBoxHelper.render(2000));

      expect(html).toContain(Icons.gem);
      expect(html).not.toContain('coin-icon');
    });
  });
});
