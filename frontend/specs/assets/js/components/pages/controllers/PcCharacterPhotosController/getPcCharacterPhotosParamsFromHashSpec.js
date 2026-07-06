import PcCharacterPhotosController
  from '../../../../../../../assets/js/components/pages/controllers/PcCharacterPhotosController.js';

describe('PcCharacterPhotosController', function() {
  it('extracts game slug and character id from the pc photos hash', function() {
    expect(PcCharacterPhotosController.getPcCharacterPhotosParamsFromHash('#/games/demo/pcs/7/photos'))
      .toEqual({ game_slug: 'demo', character_id: '7' });
  });

  it('returns empty strings when hash does not match the pc photos route', function() {
    expect(PcCharacterPhotosController.getPcCharacterPhotosParamsFromHash('#/games/demo/pcs/7'))
      .toEqual({ game_slug: '', character_id: '' });
  });
});
