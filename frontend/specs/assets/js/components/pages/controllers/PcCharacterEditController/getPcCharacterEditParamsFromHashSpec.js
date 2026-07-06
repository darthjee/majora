import { getPcCharacterEditParamsFromHash }
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterEditController.js';

describe('PcCharacterEditController', function() {
  it('extracts character params from an edit hash', function() {
    expect(getPcCharacterEditParamsFromHash('#/games/demo/pcs/1/edit')).toEqual({
      game_slug: 'demo',
      character_id: '1',
    });
  });
});
