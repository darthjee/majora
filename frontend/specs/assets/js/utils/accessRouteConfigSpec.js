import accessRouteConfig from '../../../../assets/js/utils/accessRouteConfig.js';

describe('accessRouteConfig', function() {
  it('declares a single game descriptor for the game page', function() {
    expect(accessRouteConfig.game).toEqual([
      { kind: 'game', pattern: '/games/:game_slug', params: ['game_slug'] },
    ]);
  });

  it('declares a character descriptor for a PC character page', function() {
    expect(accessRouteConfig.pcCharacter).toEqual([{
      kind: 'character',
      characterKind: 'pcs',
      pattern: '/games/:game_slug/pcs/:character_id',
      params: ['game_slug', 'character_id'],
    }]);
  });

  it('declares a character descriptor for an NPC character page', function() {
    expect(accessRouteConfig.npcCharacter).toEqual([{
      kind: 'character',
      characterKind: 'npcs',
      pattern: '/games/:game_slug/npcs/:character_id',
      params: ['game_slug', 'character_id'],
    }]);
  });

  it('declares both a superuser and a treasure descriptor for the treasure edit page', function() {
    expect(accessRouteConfig.treasureEdit).toEqual([
      { kind: 'superuser' },
      { kind: 'treasure', pattern: '/treasures/:treasure_id/edit', params: ['treasure_id'] },
    ]);
  });

  it('declares a superuser-only descriptor for the treasures index page', function() {
    expect(accessRouteConfig.treasures).toEqual([{ kind: 'superuser' }]);
  });

  it('declares a staffOrSuperuser-only descriptor for the staff users pages', function() {
    expect(accessRouteConfig.staffUsers).toEqual([{ kind: 'staffOrSuperuser' }]);
    expect(accessRouteConfig.staffUser).toEqual([{ kind: 'staffOrSuperuser' }]);
    expect(accessRouteConfig.staffUserEdit).toEqual([{ kind: 'staffOrSuperuser' }]);
  });

  it('has no entry for pages without an access check', function() {
    expect(accessRouteConfig.games).toBeUndefined();
    expect(accessRouteConfig.home).toBeUndefined();
    expect(accessRouteConfig.gamePcs).toBeUndefined();
  });

  it('only uses recognized descriptor kinds', function() {
    const validKinds = ['game', 'character', 'treasure', 'superuser', 'staffOrSuperuser'];

    Object.values(accessRouteConfig).forEach((descriptors) => {
      expect(Array.isArray(descriptors)).toBe(true);
      descriptors.forEach((descriptor) => {
        expect(validKinds).toContain(descriptor.kind);
      });
    });
  });
});
