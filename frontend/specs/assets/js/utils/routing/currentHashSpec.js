import getCurrentHash from '../../../../../assets/js/utils/routing/currentHash.js';

describe('getCurrentHash', function() {
  it('returns an empty string when window is unavailable', function() {
    expect(getCurrentHash()).toBe('');
  });

  describe('when window is available', function() {
    beforeEach(function() {
      globalThis.window = { location: { hash: '#/games/demo' } };
    });

    afterEach(function() {
      delete globalThis.window;
    });

    it('returns the current window location hash', function() {
      expect(getCurrentHash()).toBe('#/games/demo');
    });
  });
});
