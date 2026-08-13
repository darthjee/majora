import BaseCharacterPossessionEditController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/BaseCharacterPossessionEditController.js';

describe('BaseCharacterPossessionEditController', function() {
  describe('.getParamsFromHash', function() {
    it('extracts the game slug, character id, and possession id for pcs', function() {
      expect(BaseCharacterPossessionEditController.getParamsFromHash('pcs', '#/games/demo/pcs/7/possessions/5/edit'))
        .toEqual({ game_slug: 'demo', character_id: '7', id: '5' });
    });

    it('extracts the game slug, character id, and possession id for npcs', function() {
      expect(
        BaseCharacterPossessionEditController.getParamsFromHash('npcs', '#/games/demo/npcs/9/possessions/3/edit'),
      ).toEqual({ game_slug: 'demo', character_id: '9', id: '3' });
    });

    it('defaults to empty strings for a non-matching hash', function() {
      expect(BaseCharacterPossessionEditController.getParamsFromHash('pcs', '#/games/demo')).toEqual({
        game_slug: '', character_id: '', id: '',
      });
    });
  });
});
