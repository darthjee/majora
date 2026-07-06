import { getGameSlugFromHash }
  from '../../../../../../../assets/js/components/pages/controllers/GameController.js';

describe('GameController', function() {
  it('extracts game slug from hash', function() {
    expect(getGameSlugFromHash('#/games/demo')).toBe('demo');
  });
});
