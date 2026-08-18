import GameCommonItemEditController
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/controllers/GameCommonItemEditController.js';

describe('GameCommonItemEditController', function() {
  describe('.getParamsFromHash', function() {
    it('extracts the game slug and common item id', function() {
      expect(GameCommonItemEditController.getParamsFromHash('#/games/demo/common_items/5/edit')).toEqual({
        game_slug: 'demo', id: '5',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(GameCommonItemEditController.getParamsFromHash('#/games/demo')).toEqual({
        game_slug: '', id: '',
      });
    });
  });
});
