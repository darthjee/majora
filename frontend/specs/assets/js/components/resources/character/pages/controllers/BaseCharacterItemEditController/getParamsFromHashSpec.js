import BaseCharacterItemEditController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterItemEditController.js';

describe('BaseCharacterItemEditController', function() {
  describe('.getParamsFromHash', function() {
    it('extracts the game slug, character id, and item id for pcs', function() {
      expect(BaseCharacterItemEditController.getParamsFromHash('pcs', '#/games/demo/pcs/7/items/5/edit')).toEqual({
        game_slug: 'demo', character_id: '7', id: '5',
      });
    });

    it('extracts the game slug, character id, and item id for npcs', function() {
      expect(BaseCharacterItemEditController.getParamsFromHash('npcs', '#/games/demo/npcs/9/items/3/edit')).toEqual({
        game_slug: 'demo', character_id: '9', id: '3',
      });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(BaseCharacterItemEditController.getParamsFromHash('pcs', '#/games/demo')).toEqual({
        game_slug: '', character_id: '', id: '',
      });
    });
  });
});
