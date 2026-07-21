import HashRouteResolver from '../../../../../assets/js/utils/routing/HashRouteResolver.js';

describe('HashRouteResolver', function() {
  it('resolves known pages', function() {
    expect(new HashRouteResolver(() => '#/games').getPage()).toBe('games');
    expect(new HashRouteResolver(() => '#/games/new').getPage()).toBe('gameNew');
    expect(new HashRouteResolver(() => '#/games/campaign').getPage()).toBe('game');
    expect(new HashRouteResolver(() => '#/games/campaign/edit').getPage()).toBe('gameEdit');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs').getPage()).toBe('gamePcs');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs').getPage()).toBe('gameNpcs');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/new').getPage()).toBe('gameNpcNew');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7').getPage()).toBe('npcCharacter');
    expect(new HashRouteResolver(() => '#/games/campaign/treasures').getPage()).toBe('gameTreasures');
    expect(new HashRouteResolver(() => '#/games/campaign/treasures/new').getPage()).toBe('gameTreasureNew');
    expect(new HashRouteResolver(() => '#/games/campaign/treasures/7/edit').getPage()).toBe('gameTreasureEdit');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7').getPage()).toBe('pcCharacter');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/edit').getPage()).toBe('pcCharacterEdit');
    expect(new HashRouteResolver(() => '#/games/campaign/photos').getPage()).toBe('gamePhotos');
    expect(new HashRouteResolver(() => '#/games/campaign/polls').getPage()).toBe('gamePolls');
    expect(new HashRouteResolver(() => '#/games/campaign/polls/new').getPage()).toBe('gamePollNew');
    expect(new HashRouteResolver(() => '#/games/campaign/polls/7').getPage()).toBe('gamePoll');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/photos').getPage()).toBe('pcCharacterPhotos');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/photos').getPage()).toBe('npcCharacterPhotos');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/treasures').getPage()).toBe('pcCharacterTreasures');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/treasures').getPage()).toBe('npcCharacterTreasures');
    expect(new HashRouteResolver(() => '#/games/campaign/items').getPage()).toBe('gameItems');
    expect(new HashRouteResolver(() => '#/games/campaign/items/5').getPage()).toBe('gameItem');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/items').getPage()).toBe('pcCharacterItems');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/items/5').getPage()).toBe('pcCharacterItem');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/items').getPage()).toBe('npcCharacterItems');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/items/5').getPage()).toBe('npcCharacterItem');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/items/new').getPage()).toBe('pcCharacterItemNew');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/items/new').getPage()).toBe('npcCharacterItemNew');
    expect(new HashRouteResolver(() => '#/games/campaign/documents').getPage()).toBe('gameDocuments');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/documents').getPage()).toBe('pcCharacterDocuments');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/documents').getPage()).toBe('npcCharacterDocuments');
    expect(new HashRouteResolver(() => '#/recover-password?token=abc').getPage()).toBe('recoverPassword');
    expect(new HashRouteResolver(() => '#/users/register').getPage()).toBe('register');
    expect(new HashRouteResolver(() => '#/my_account').getPage()).toBe('myAccount');
    expect(new HashRouteResolver(() => '#/my-games').getPage()).toBe('myGames');
    expect(new HashRouteResolver(() => '#/staff/users').getPage()).toBe('staffUsers');
    expect(new HashRouteResolver(() => '#/staff/users/7').getPage()).toBe('staffUser');
    expect(new HashRouteResolver(() => '#/staff/users/7/edit').getPage()).toBe('staffUserEdit');
    expect(new HashRouteResolver(() => '#/games/campaign/players').getPage()).toBe('gamePlayers');
    expect(new HashRouteResolver(() => '#/games/campaign/players/7').getPage()).toBe('gamePlayer');
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

  it('resolves /games/:game_slug/pcs/:character_id/treasures to pcCharacterTreasures, not pcCharacter', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/treasures').getPage()).toBe('pcCharacterTreasures');
  });

  it('resolves /games/:game_slug/npcs/:character_id/treasures to npcCharacterTreasures, not npcCharacter', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/treasures').getPage()).toBe('npcCharacterTreasures');
  });

  it('resolves /games/:game_slug/pcs/:character_id/items to pcCharacterItems, not pcCharacter', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/items').getPage()).toBe('pcCharacterItems');
  });

  it('resolves /games/:game_slug/npcs/:character_id/items to npcCharacterItems, not npcCharacter', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/items').getPage()).toBe('npcCharacterItems');
  });

  it('resolves /games/:game_slug/pcs/:character_id/items/new to pcCharacterItemNew, not pcCharacterItems', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/items/new').getPage()).toBe('pcCharacterItemNew');
  });

  it('resolves /games/:game_slug/npcs/:character_id/items/new to npcCharacterItemNew, not npcCharacterItems', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/items/new').getPage()).toBe('npcCharacterItemNew');
  });

  it('resolves /games/:game_slug/items to gameItems, not game', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/items').getPage()).toBe('gameItems');
  });

  it('resolves /games/:game_slug/items/:id to gameItem, not gameItems', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/items/5').getPage()).toBe('gameItem');
  });

  it('resolves /games/:game_slug/pcs/:character_id/items/:id to pcCharacterItem, not pcCharacterItems', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/items/5').getPage()).toBe('pcCharacterItem');
  });

  it(
    'resolves /games/:game_slug/npcs/:character_id/items/:id to npcCharacterItem, not npcCharacterItems',
    function() {
      expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/items/5').getPage()).toBe('npcCharacterItem');
    },
  );

  it('still resolves /games/:game_slug/pcs/:character_id/items/new to pcCharacterItemNew, not pcCharacterItem',
    function() {
      expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/items/new').getPage()).toBe('pcCharacterItemNew');
    });

  it(
    'still resolves /games/:game_slug/npcs/:character_id/items/new to npcCharacterItemNew, not npcCharacterItem',
    function() {
      expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/items/new').getPage()).toBe('npcCharacterItemNew');
    },
  );

  it('resolves /games/:game_slug/pcs/:character_id/documents to pcCharacterDocuments, not pcCharacter', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/documents').getPage()).toBe('pcCharacterDocuments');
  });

  it('resolves /games/:game_slug/npcs/:character_id/documents to npcCharacterDocuments, not npcCharacter', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/documents').getPage()).toBe('npcCharacterDocuments');
  });

  it('resolves /games/:game_slug/documents to gameDocuments, not game', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/documents').getPage()).toBe('gameDocuments');
  });

  it('resolves /games/:game_slug/photos to gamePhotos, not game', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/photos').getPage()).toBe('gamePhotos');
  });

  it('resolves /games/:game_slug/players/:id to gamePlayer, not gamePlayers', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/players/7').getPage()).toBe('gamePlayer');
  });

  it('still resolves /games/:game_slug/players to gamePlayers', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/players').getPage()).toBe('gamePlayers');
  });

  it('resolves /games/:game_slug/npcs/new to gameNpcNew, not npcCharacter', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/new').getPage()).toBe('gameNpcNew');
  });

  it('still resolves /games/:game_slug/npcs/:character_id to npcCharacter', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7').getPage()).toBe('npcCharacter');
  });

  it('resolves /games/:game_slug/treasures/new to gameTreasureNew, not gameTreasures', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/treasures/new').getPage()).toBe('gameTreasureNew');
  });

  it('resolves /games/:game_slug/treasures/:treasure_id/edit to gameTreasureEdit', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/treasures/7/edit').getPage()).toBe('gameTreasureEdit');
  });

  it('still resolves /games/:game_slug/treasures to gameTreasures', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/treasures').getPage()).toBe('gameTreasures');
  });

  it('resolves /games/:game_slug/polls/new to gamePollNew, not gamePoll', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/polls/new').getPage()).toBe('gamePollNew');
  });

  it('resolves /games/:game_slug/polls/:id to gamePoll, not gamePolls', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/polls/7').getPage()).toBe('gamePoll');
  });

  it('still resolves /games/:game_slug/polls to gamePolls', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/polls').getPage()).toBe('gamePolls');
  });

  it('falls back to home for unknown routes', function() {
    expect(new HashRouteResolver(() => '#/other').getPage()).toBe('home');
  });

  it('extracts pagination params only', function() {
    const params = new HashRouteResolver(() => '#/games?page=2&foo=bar&per_page=12').getPaginationParams();
    expect(params.toString()).toBe('page=2&per_page=12');
  });

  it('extracts filter params only', function() {
    const params = new HashRouteResolver(
      () => '#/games/campaign/npcs?slain=true&name=gob&allegiance=ally&page=2',
    ).getFilterParams();
    expect(params.toString()).toBe('slain=true&name=gob&allegiance=ally');
  });

  it('extracts the npc hidden filter param', function() {
    const params = new HashRouteResolver(
      () => '#/games/campaign/npcs?hidden=true&page=2',
    ).getFilterParams();
    expect(params.toString()).toBe('hidden=true');
  });

  it('ignores filter params when absent from the hash', function() {
    const params = new HashRouteResolver(() => '#/games/campaign/npcs?page=2').getFilterParams();
    expect(params.toString()).toBe('');
  });

  it('extracts the treasure filter params', function() {
    const params = new HashRouteResolver(
      () => '#/treasures?game_type=dnd&min_value=10&max_value=100&name=sword&page=2',
    ).getFilterParams();
    expect(params.toString()).toBe('name=sword&game_type=dnd&min_value=10&max_value=100');
  });

  it('extracts the poll status filter param', function() {
    const params = new HashRouteResolver(() => '#/games/campaign/polls?status=open&page=2').getFilterParams();
    expect(params.toString()).toBe('status=open');
  });

  describe('#getParams', function() {
    it('extracts a single param for a matching path', function() {
      const resolver = new HashRouteResolver(() => '#/games/campaign');
      expect(resolver.getParams('/games/:game_slug')).toEqual({ game_slug: 'campaign' });
    });

    it('extracts multiple params for a matching path', function() {
      const resolver = new HashRouteResolver(() => '#/games/campaign/pcs/7');
      expect(resolver.getParams('/games/:game_slug/pcs/:character_id'))
        .toEqual({ game_slug: 'campaign', character_id: '7' });
    });

    it('ignores query params when extracting', function() {
      const resolver = new HashRouteResolver(() => '#/games/campaign?page=2');
      expect(resolver.getParams('/games/:game_slug')).toEqual({ game_slug: 'campaign' });
    });

    it('returns an empty object when the path does not match the pattern', function() {
      const resolver = new HashRouteResolver(() => '#/games/campaign/pcs/7');
      expect(resolver.getParams('/games/:game_slug')).toEqual({});
    });
  });
});
