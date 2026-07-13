import GameEditController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameEditController.js';

describe('GameEditController', function() {
  it('extracts game slug from an edit hash', function() {
    expect(GameEditController.getGameSlugFromEditHash('#/games/demo/edit')).toBe('demo');
  });

  it('returns an empty string when the hash does not match the edit route', function() {
    expect(GameEditController.getGameSlugFromEditHash('#/games/demo')).toBe('');
  });
});
