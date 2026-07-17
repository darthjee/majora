import { renderToStaticMarkup } from 'react-dom/server';
import { helper, buildHandlers, buildState } from './support.js';

describe('BaseCharacterEditHelper', function() {
  describe('#render treasure value', function() {
    it('does not render a treasure box when treasureValue is 0', function() {
      const html = renderToStaticMarkup(
        helper.render(buildState({ money: '310', treasureValue: 0 }), buildHandlers())
      );

      expect(html).not.toContain('coin-box-treasure');
    });

    it('does not render a treasure box when treasureValue is not given', function() {
      const html = renderToStaticMarkup(
        helper.render(buildState({ money: '310' }), buildHandlers())
      );

      expect(html).not.toContain('coin-box-treasure');
    });

    it('renders "20 GP in Gems" for a dnd treasureValue of 2000', function() {
      const html = renderToStaticMarkup(
        helper.render(buildState({ money: '310', treasureValue: 2000 }), buildHandlers())
      );

      expect(html).toContain('coin-box-treasure');
      expect(html).toContain('20 GP in Gems');
    });

    it('renders "2 SP | 20 GP in Gems" for a dnd treasureValue of 2020', function() {
      const html = renderToStaticMarkup(
        helper.render(buildState({ money: '310', treasureValue: 2020 }), buildHandlers())
      );

      expect(html).toContain('2 SP | 20 GP in Gems');
    });

    it('renders a gold deadlands treasure box for a non-zero treasureValue', function() {
      const html = renderToStaticMarkup(
        helper.render(
          buildState({ money: '350', treasureValue: 10002, gameType: 'deadlands' }),
          buildHandlers()
        )
      );

      expect(html).toContain('character-money-bill-treasure');
      expect(html).toContain('100,02');
      expect(html).toContain('in Gems');
    });
  });
});
