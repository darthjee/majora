import gameSlugFromHash from '../../../../../assets/js/utils/routing/GameSlugFromHash.js';

describe('gameSlugFromHash', function() {
  it('extracts the game slug from a game show route', function() {
    expect(gameSlugFromHash('#/games/epic-quest')).toBe('epic-quest');
  });

  it('extracts the game slug from a nested game route', function() {
    expect(gameSlugFromHash('#/games/epic-quest/pcs/7')).toBe('epic-quest');
  });

  it('extracts the game slug without a leading hash', function() {
    expect(gameSlugFromHash('/games/epic-quest')).toBe('epic-quest');
  });

  it('returns undefined for the game-creation route', function() {
    expect(gameSlugFromHash('#/games/new')).toBeUndefined();
  });

  it('returns undefined for unrelated routes', function() {
    expect(gameSlugFromHash('#/games')).toBeUndefined();
  });

  it('returns undefined for an empty hash', function() {
    expect(gameSlugFromHash('')).toBeUndefined();
  });

  it('returns undefined when no hash is given', function() {
    expect(gameSlugFromHash(undefined)).toBeUndefined();
  });
});
