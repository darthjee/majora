import HashRouteResolver from '../../../../../assets/js/utils/routing/HashRouteResolver.js';

describe('HashRouteResolver (game common item routes, issue #826)', function() {
  it('resolves known common item pages', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/common_items').getPage()).toBe('gameCommonItems');
    expect(new HashRouteResolver(() => '#/games/campaign/common_items/5').getPage()).toBe('gameCommonItem');
    expect(new HashRouteResolver(() => '#/games/campaign/common_items/5/edit').getPage())
      .toBe('gameCommonItemEdit');
    expect(new HashRouteResolver(() => '#/games/campaign/common_items/new').getPage()).toBe('gameCommonItemNew');
  });

  it('resolves /games/:game_slug/common_items to gameCommonItems, not game', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/common_items').getPage()).toBe('gameCommonItems');
  });

  it('resolves /games/:game_slug/common_items/:id to gameCommonItem, not gameCommonItems', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/common_items/5').getPage()).toBe('gameCommonItem');
  });

  it('resolves /games/:game_slug/common_items/new to gameCommonItemNew, not gameCommonItem', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/common_items/new').getPage()).toBe('gameCommonItemNew');
  });

  it('resolves /games/:game_slug/common_items/:id/edit to gameCommonItemEdit, not gameCommonItem', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/common_items/5/edit').getPage())
      .toBe('gameCommonItemEdit');
  });
});
