import CharacterPossessionNewController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterPossessionNewController.js';

describe('CharacterPossessionNewController', function() {
  describe('.getParamsFromPossessionNewHash', function() {
    it('extracts game slug/character id from a PC possession new hash', function() {
      expect(
        CharacterPossessionNewController.getParamsFromPossessionNewHash('pcs', '#/games/demo/pcs/7/possessions/new'),
      ).toEqual({ game_slug: 'demo', character_id: '7' });
    });

    it('extracts game slug/character id from an NPC possession new hash', function() {
      expect(
        CharacterPossessionNewController.getParamsFromPossessionNewHash('npcs', '#/games/demo/npcs/9/possessions/new'),
      ).toEqual({ game_slug: 'demo', character_id: '9' });
    });

    it('returns empty strings when the hash does not match the new route', function() {
      expect(
        CharacterPossessionNewController.getParamsFromPossessionNewHash('pcs', '#/games/demo/pcs/7/possessions'),
      ).toEqual({ game_slug: '', character_id: '' });
    });
  });
});
