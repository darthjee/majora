import { getNpcCharacterTreasuresParamsFromHash }
  from '../../../../../../../assets/js/components/pages/controllers/NpcCharacterTreasuresController.js';

describe('NpcCharacterTreasuresController', function() {
  it('extracts game slug and character id from treasures hash', function() {
    expect(getNpcCharacterTreasuresParamsFromHash('#/games/demo/npcs/2/treasures')).toEqual({
      game_slug: 'demo',
      character_id: '2',
    });
  });

  it('returns empty strings when hash does not match the treasures route', function() {
    expect(getNpcCharacterTreasuresParamsFromHash('#/games/demo/npcs/2')).toEqual({
      game_slug: '',
      character_id: '',
    });
  });
});
