import { renderToStaticMarkup } from 'react-dom/server';
import CharacterHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/CharacterHelper.jsx';
import { character } from './support.js';

describe('CharacterHelper', function() {
  describe('.render treasure value', function() {
    it('does not render a treasure box when treasure_value is 0', function() {
      const c = { ...character, money: 310, treasure_value: 0, game_type: 'dnd' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('coin-box-treasure');
    });

    it('does not render a treasure box when treasure_value is absent', function() {
      const c = { ...character, money: 310, game_type: 'dnd' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).not.toContain('coin-box-treasure');
    });

    it('renders "20 GP in Gems" for a dnd treasure_value of 2000', function() {
      const c = { ...character, money: 310, treasure_value: 2000, game_type: 'dnd' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('coin-box-treasure');
      expect(html).toContain('20 GP in Gems');
    });

    it('renders "2 SP | 20 GP in Gems" for a dnd treasure_value of 2020', function() {
      const c = { ...character, money: 310, treasure_value: 2020, game_type: 'dnd' };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('2 SP | 20 GP in Gems');
    });

    it('renders a gold deadlands treasure box for a non-zero treasure_value', function() {
      const c = {
        ...character, money: 350, treasure_value: 10002, game_type: 'deadlands',
      };
      const html = renderToStaticMarkup(CharacterHelper.render(c, '#/games/demo/pcs'));
      expect(html).toContain('character-money-bill-treasure');
      expect(html).toContain('100,02');
      expect(html).toContain('in Gems');
    });
  });
});
