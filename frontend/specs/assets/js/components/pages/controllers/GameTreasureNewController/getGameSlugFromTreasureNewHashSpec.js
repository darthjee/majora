import { getGameSlugFromTreasureNewHash }
  from '../../../../../../../assets/js/components/pages/controllers/GameTreasureNewController.js';

describe('GameTreasureNewController', function() {
  it('extracts game slug from a treasure new hash', function() {
    expect(getGameSlugFromTreasureNewHash('#/games/demo/treasures/new')).toBe('demo');
  });

  it('returns empty string when the hash does not match the new route', function() {
    expect(getGameSlugFromTreasureNewHash('#/games/demo/treasures')).toBe('');
  });
});
