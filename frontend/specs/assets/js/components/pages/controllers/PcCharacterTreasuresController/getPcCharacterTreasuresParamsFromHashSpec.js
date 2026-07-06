import { getPcCharacterTreasuresParamsFromHash }
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterTreasuresController.js';

describe('PcCharacterTreasuresController', function() {
  it('extracts game slug and character id from treasures hash', function() {
    expect(getPcCharacterTreasuresParamsFromHash('#/games/demo/pcs/2/treasures')).toEqual({
      game_slug: 'demo',
      character_id: '2',
    });
  });

  it('returns empty strings when hash does not match the treasures route', function() {
    expect(getPcCharacterTreasuresParamsFromHash('#/games/demo/pcs/2')).toEqual({
      game_slug: '',
      character_id: '',
    });
  });
});
