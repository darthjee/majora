import { getGameSlugFromSessionNewHash }
  from '../../../../../../../assets/js/components/pages/controllers/GameSessionNewController.js';

describe('GameSessionNewController', function() {
  it('extracts game slug from a session new hash', function() {
    expect(getGameSlugFromSessionNewHash('#/games/demo/sessions/new')).toBe('demo');
  });

  it('returns empty string when the hash does not match the new route', function() {
    expect(getGameSlugFromSessionNewHash('#/games/demo/sessions')).toBe('');
  });
});
