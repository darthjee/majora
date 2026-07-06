import { getNpcCharacterParamsFromHash }
  from '../../../../../../../assets/js/components/pages/controllers/NpcCharacterController.js';

describe('NpcCharacterController', function() {
  it('extracts character params from hash', function() {
    expect(getNpcCharacterParamsFromHash('#/games/demo/npcs/1')).toEqual({
      game_slug: 'demo',
      character_id: '1',
    });
  });
});
