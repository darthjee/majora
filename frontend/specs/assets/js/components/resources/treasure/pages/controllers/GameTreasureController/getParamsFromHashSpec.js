import GameTreasureController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasureController.js';

describe('GameTreasureController.getParamsFromHash', function() {
  it('extracts the game slug and treasure id', function() {
    expect(GameTreasureController.getParamsFromHash('#/games/demo/treasures/5')).toEqual({
      game_slug: 'demo', treasure_id: '5',
    });
  });

  it('defaults to empty strings for a non-matching hash', function() {
    expect(GameTreasureController.getParamsFromHash('#/games/demo')).toEqual({
      game_slug: '', treasure_id: '',
    });
  });
});
