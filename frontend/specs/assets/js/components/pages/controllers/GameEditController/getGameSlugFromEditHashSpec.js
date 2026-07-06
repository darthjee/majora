import { getGameSlugFromEditHash }
  from '../../../../../../../assets/js/components/pages/controllers/GameEditController.js';

describe('GameEditController', function() {
  it('extracts game slug from an edit hash', function() {
    expect(getGameSlugFromEditHash('#/games/demo/edit')).toBe('demo');
  });

  it('returns an empty string when the hash does not match the edit route', function() {
    expect(getGameSlugFromEditHash('#/games/demo')).toBe('');
  });
});
