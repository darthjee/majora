import CharacterItemNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemNewController.js';

describe('CharacterItemNewController', function() {
  describe('.getParamsFromItemNewHash', function() {
    it('extracts game slug/character id from a PC item new hash', function() {
      expect(CharacterItemNewController.getParamsFromItemNewHash('pcs', '#/games/demo/pcs/7/items/new'))
        .toEqual({ game_slug: 'demo', character_id: '7' });
    });

    it('extracts game slug/character id from an NPC item new hash', function() {
      expect(CharacterItemNewController.getParamsFromItemNewHash('npcs', '#/games/demo/npcs/9/items/new'))
        .toEqual({ game_slug: 'demo', character_id: '9' });
    });

    it('returns empty strings when the hash does not match the new route', function() {
      expect(CharacterItemNewController.getParamsFromItemNewHash('pcs', '#/games/demo/pcs/7/items'))
        .toEqual({ game_slug: '', character_id: '' });
    });
  });
});
