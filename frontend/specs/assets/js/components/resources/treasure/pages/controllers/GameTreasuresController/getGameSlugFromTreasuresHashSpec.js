import GameTreasuresController
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/controllers/GameTreasuresController.js';

describe('GameTreasuresController', function() {
  it('extracts game slug from treasures hash', function() {
    expect(GameTreasuresController.getGameSlugFromTreasuresHash('#/games/demo/treasures')).toBe('demo');
  });

  it('returns empty string when hash does not match treasures route', function() {
    expect(GameTreasuresController.getGameSlugFromTreasuresHash('#/games/demo')).toBe('');
  });
});
