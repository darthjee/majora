import HashRouteResolver from '../../../../assets/js/utils/HashRouteResolver.js';

describe('HashRouteResolver', function() {
  it('resolves known pages', function() {
    expect(new HashRouteResolver(() => '#/games').getPage()).toBe('games');
    expect(new HashRouteResolver(() => '#/games/campaign').getPage()).toBe('game');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs').getPage()).toBe('gamePcs');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs').getPage()).toBe('gameNpcs');
    expect(new HashRouteResolver(() => '#/games/campaign/characters/7').getPage()).toBe('character');
  });

  it('falls back to home for unknown routes', function() {
    expect(new HashRouteResolver(() => '#/other').getPage()).toBe('home');
  });

  it('extracts pagination params only', function() {
    const params = new HashRouteResolver(() => '#/games?page=2&foo=bar&per_page=12').getPaginationParams();
    expect(params.toString()).toBe('page=2&per_page=12');
  });
});
