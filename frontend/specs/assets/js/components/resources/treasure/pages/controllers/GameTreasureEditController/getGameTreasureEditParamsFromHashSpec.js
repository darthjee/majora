import GameTreasureEditController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasureEditController.js';

describe('GameTreasureEditController', function() {
  it('extracts game slug and treasure id from an edit hash', function() {
    expect(GameTreasureEditController.getGameTreasureEditParamsFromHash('#/games/demo/treasures/42/edit')).toEqual({
      game_slug: 'demo', treasure_id: '42',
    });
  });

  it('returns empty strings when the hash does not match the edit route', function() {
    expect(GameTreasureEditController.getGameTreasureEditParamsFromHash('#/games/demo/treasures/42')).toEqual({
      game_slug: '', treasure_id: '',
    });
  });
});
