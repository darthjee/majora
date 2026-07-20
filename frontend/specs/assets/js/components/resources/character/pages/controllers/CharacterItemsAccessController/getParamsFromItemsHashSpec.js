import CharacterItemsAccessController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterItemsAccessController.js';

describe('CharacterItemsAccessController', function() {
  describe('.getParamsFromItemsHash', function() {
    it('extracts game slug/character id from a PC items hash', function() {
      expect(CharacterItemsAccessController.getParamsFromItemsHash('pcs', '#/games/demo/pcs/7/items'))
        .toEqual({ game_slug: 'demo', character_id: '7' });
    });

    it('extracts game slug/character id from an NPC items hash', function() {
      expect(CharacterItemsAccessController.getParamsFromItemsHash('npcs', '#/games/demo/npcs/9/items'))
        .toEqual({ game_slug: 'demo', character_id: '9' });
    });

    it('returns empty strings when the hash does not match the items route', function() {
      expect(CharacterItemsAccessController.getParamsFromItemsHash('pcs', '#/games/demo/pcs/7'))
        .toEqual({ game_slug: '', character_id: '' });
    });
  });
});
