import CharacterPossessionsAccessController
  from '../../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterPossessionsAccessController.js';

describe('CharacterPossessionsAccessController', function() {
  describe('.getParamsFromPossessionsHash', function() {
    it('extracts game slug/character id from a PC possessions hash', function() {
      expect(CharacterPossessionsAccessController.getParamsFromPossessionsHash('pcs', '#/games/demo/pcs/7/possessions'))
        .toEqual({ game_slug: 'demo', character_id: '7' });
    });

    it('extracts game slug/character id from an NPC possessions hash', function() {
      expect(
        CharacterPossessionsAccessController.getParamsFromPossessionsHash('npcs', '#/games/demo/npcs/9/possessions'),
      ).toEqual({ game_slug: 'demo', character_id: '9' });
    });

    it('returns empty strings when the hash does not match the possessions route', function() {
      expect(CharacterPossessionsAccessController.getParamsFromPossessionsHash('pcs', '#/games/demo/pcs/7'))
        .toEqual({ game_slug: '', character_id: '' });
    });
  });
});
