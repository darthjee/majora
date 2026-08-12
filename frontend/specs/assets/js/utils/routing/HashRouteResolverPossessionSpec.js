import HashRouteResolver from '../../../../../assets/js/utils/routing/HashRouteResolver.js';

describe('HashRouteResolver (game possession routes, issue #1074)', function() {
  it('resolves known possession pages', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/possessions').getPage()).toBe('gamePossessions');
    expect(new HashRouteResolver(() => '#/games/campaign/possessions/5').getPage()).toBe('gamePossession');
    expect(new HashRouteResolver(() => '#/games/campaign/possessions/5/edit').getPage()).toBe('gamePossessionEdit');
    expect(new HashRouteResolver(() => '#/games/campaign/possessions/new').getPage()).toBe('gamePossessionNew');
  });

  it('resolves /games/:game_slug/possessions to gamePossessions, not game', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/possessions').getPage()).toBe('gamePossessions');
  });

  it('resolves /games/:game_slug/possessions/:id to gamePossession, not gamePossessions', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/possessions/5').getPage()).toBe('gamePossession');
  });

  it('resolves /games/:game_slug/possessions/new to gamePossessionNew, not gamePossession', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/possessions/new').getPage()).toBe('gamePossessionNew');
  });

  it('resolves /games/:game_slug/possessions/:id/edit to gamePossessionEdit, not gamePossession', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/possessions/5/edit').getPage()).toBe('gamePossessionEdit');
  });
});
