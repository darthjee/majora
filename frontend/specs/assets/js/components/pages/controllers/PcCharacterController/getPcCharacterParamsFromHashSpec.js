import PcCharacterController
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterController.js';

describe('PcCharacterController', function() {
  it('extracts character params from hash', function() {
    expect(PcCharacterController.getPcCharacterParamsFromHash('#/games/demo/pcs/1')).toEqual({
      game_slug: 'demo',
      character_id: '1',
    });
  });
});
