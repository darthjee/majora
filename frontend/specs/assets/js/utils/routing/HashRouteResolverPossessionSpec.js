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

describe('HashRouteResolver (character possession routes, issue #1076)', function() {
  it('resolves known PC/NPC possession pages', function() {
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/possessions').getPage()).toBe('pcCharacterPossessions');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/possessions/5').getPage()).toBe('pcCharacterPossession');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/possessions/5/edit').getPage())
      .toBe('pcCharacterPossessionEdit');
    expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/possessions/new').getPage())
      .toBe('pcCharacterPossessionNew');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/possessions').getPage()).toBe('npcCharacterPossessions');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/possessions/5').getPage()).toBe('npcCharacterPossession');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/possessions/5/edit').getPage())
      .toBe('npcCharacterPossessionEdit');
    expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/possessions/new').getPage())
      .toBe('npcCharacterPossessionNew');
  });

  it('resolves /games/:game_slug/pcs/:character_id/possessions to pcCharacterPossessions, not pcCharacter',
    function() {
      expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/possessions').getPage())
        .toBe('pcCharacterPossessions');
    });

  it('resolves /games/:game_slug/npcs/:character_id/possessions to npcCharacterPossessions, not npcCharacter',
    function() {
      expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/possessions').getPage())
        .toBe('npcCharacterPossessions');
    });

  it(
    'resolves /games/:game_slug/pcs/:character_id/possessions/new to pcCharacterPossessionNew, '
      + 'not pcCharacterPossessions',
    function() {
      expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/possessions/new').getPage())
        .toBe('pcCharacterPossessionNew');
    },
  );

  it(
    'resolves /games/:game_slug/npcs/:character_id/possessions/new to npcCharacterPossessionNew, '
      + 'not npcCharacterPossessions',
    function() {
      expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/possessions/new').getPage())
        .toBe('npcCharacterPossessionNew');
    },
  );

  it(
    'resolves /games/:game_slug/pcs/:character_id/possessions/:id to pcCharacterPossession, '
      + 'not pcCharacterPossessions',
    function() {
      expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/possessions/5').getPage())
        .toBe('pcCharacterPossession');
    },
  );

  it(
    'resolves /games/:game_slug/npcs/:character_id/possessions/:id to npcCharacterPossession, '
      + 'not npcCharacterPossessions',
    function() {
      expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/possessions/5').getPage())
        .toBe('npcCharacterPossession');
    },
  );

  it(
    'resolves /games/:game_slug/pcs/:character_id/possessions/:id/edit to pcCharacterPossessionEdit, '
      + 'not pcCharacterPossession',
    function() {
      expect(new HashRouteResolver(() => '#/games/campaign/pcs/7/possessions/5/edit').getPage())
        .toBe('pcCharacterPossessionEdit');
    },
  );

  it(
    'resolves /games/:game_slug/npcs/:character_id/possessions/:id/edit to npcCharacterPossessionEdit, '
      + 'not npcCharacterPossession',
    function() {
      expect(new HashRouteResolver(() => '#/games/campaign/npcs/7/possessions/5/edit').getPage())
        .toBe('npcCharacterPossessionEdit');
    },
  );
});
