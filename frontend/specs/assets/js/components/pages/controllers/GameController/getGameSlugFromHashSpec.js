import GameController
  from '../../../../../../../assets/js/components/pages/controllers/GameController.js';

describe('GameController', function() {
  it('extracts game slug from hash', function() {
    expect(GameController.getGameSlugFromHash('#/games/demo')).toBe('demo');
  });
});
