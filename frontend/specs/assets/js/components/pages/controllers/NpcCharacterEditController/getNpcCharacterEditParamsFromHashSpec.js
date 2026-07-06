import { getNpcCharacterEditParamsFromHash }
  from '../../../../../../../assets/js/components/pages/controllers/NpcCharacterEditController.js';

describe('NpcCharacterEditController', function() {
  it('extracts character params from an edit hash', function() {
    expect(getNpcCharacterEditParamsFromHash('#/games/demo/npcs/1/edit')).toEqual({
      game_slug: 'demo',
      character_id: '1',
    });
  });
});
