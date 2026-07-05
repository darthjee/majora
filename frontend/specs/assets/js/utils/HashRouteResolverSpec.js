import HashRouteResolver from '../../../../assets/js/utils/HashRouteResolver.js';

describe('HashRouteResolver', function() {
  it('resolves known pages', function() {
    expect(new HashRouteResolver(() => '#/games').getPage()).toBe('games');
    expect(new HashRouteResolver(() => '#/games/new').getPage()).toBe('gameNew');
    expect(new HashRouteResolver(() => '#/games/campaign').getPage()).toBe('game');
    expect(new HashRouteResolver(() => '#/games/campaign/edit').getPage()).toBe('gameEdit');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs').getPage()).toBe('gamePcs');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs').getPage()).toBe('gameNpcs');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7').getPage()).toBe('npcCharacter');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7').getPage()).toBe('pcCharacter');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/edit').getPage()).toBe('pcCharacterEdit');
    expect(new HashRouteResolver(() => '#/games/campaign/photos').getPage()).toBe('gamePhotos');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/photos').getPage()).toBe('pcCharacterPhotos');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/photos').getPage()).toBe('npcCharacterPhotos');
    expect(new HashRouteResolver(() => '#/recover-password?token=abc').getPage()).toBe('recoverPassword');
    expect(new HashRouteResolver(() => '#/users/register').getPage()).toBe('register');
    expect(new HashRouteResolver(() => '#/my_account').getPage()).toBe('myAccount');
    expect(new HashRouteResolver(() => '#/staff/users').getPage()).toBe('staffUsers');
    expect(new HashRouteResolver(() => '#/staff/users/7').getPage()).toBe('staffUser');
    expect(new HashRouteResolver(() => '#/staff/users/7/edit').getPage()).toBe('staffUserEdit');
  });

  it('resolves /staff/users/:id/edit to staffUserEdit, not staffUser', function() {
    expect(new HashRouteResolver(() => '#/staff/users/7/edit').getPage()).toBe('staffUserEdit');
  });

  it('still resolves /staff/users/:id to staffUser', function() {
    expect(new HashRouteResolver(() => '#/staff/users/7').getPage()).toBe('staffUser');
  });

  it('resolves /games/new to gameNew, not game', function() {
    expect(new HashRouteResolver(() => '#/games/new').getPage()).toBe('gameNew');
  });

  it('resolves /games/:game_slug/edit to gameEdit, not game', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/edit').getPage()).toBe('gameEdit');
  });

  it('still resolves /games/:game_slug to game', function() {
    expect(new HashRouteResolver(() => '#/games/campaign').getPage()).toBe('game');
  });

  it('resolves /games/:game_slug/pcs/:character_id/photos to pcCharacterPhotos, not pcCharacter', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/photos').getPage()).toBe('pcCharacterPhotos');
  });

  it('resolves /games/:game_slug/npcs/:character_id/photos to npcCharacterPhotos, not npcCharacter', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/photos').getPage()).toBe('npcCharacterPhotos');
  });

  it('resolves /games/:game_slug/photos to gamePhotos, not game', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/photos').getPage()).toBe('gamePhotos');
  });

  it('falls back to home for unknown routes', function() {
    expect(new HashRouteResolver(() => '#/other').getPage()).toBe('home');
  });

  it('extracts pagination params only', function() {
    const params = new HashRouteResolver(() => '#/games?page=2&foo=bar&per_page=12').getPaginationParams();
    expect(params.toString()).toBe('page=2&per_page=12');
  });
});
