import NpcCharacterPhotosController
  from '../../../../../../../assets/js/components/pages/controllers/NpcCharacterPhotosController.js';

describe('NpcCharacterPhotosController', function() {
  it('extracts game slug and character id from the npc photos hash', function() {
    expect(NpcCharacterPhotosController.getNpcCharacterPhotosParamsFromHash('#/games/demo/npcs/7/photos'))
      .toEqual({ game_slug: 'demo', character_id: '7' });
  });

  it('returns empty strings when hash does not match the npc photos route', function() {
    expect(NpcCharacterPhotosController.getNpcCharacterPhotosParamsFromHash('#/games/demo/npcs/7'))
      .toEqual({ game_slug: '', character_id: '' });
  });
});
