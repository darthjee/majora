import Route from '../../../../assets/js/utils/Route.js';

describe('Route', function() {
  it('matches parameterized routes', function() {
    const route = new Route('/games/:game_slug/characters/:character_id', 'character');
    expect(route.matches('/games/demo/characters/10')).toBe(true);
  });

  it('extracts params from matching routes', function() {
    const route = new Route('/games/:game_slug/characters/:character_id', 'character');
    expect(route.params('/games/demo/characters/10')).toEqual({
      game_slug: 'demo',
      character_id: '10',
    });
  });

  it('returns an empty object when route does not match', function() {
    const route = new Route('/games/:game_slug', 'game');
    expect(route.params('/games')).toEqual({});
  });
});
