import accessRouteConfig from '../../../../assets/js/utils/accessRouteConfig.js';
import AccessRouteConfigStore from '../../../../assets/js/utils/AccessRouteConfigStore.js';

describe('accessRouteConfig', function() {
  beforeEach(function() {
    AccessRouteConfigStore.reset();
  });

  afterEach(function() {
    AccessRouteConfigStore.reset();
  });

  describe('#get', function() {
    it('declares a single game descriptor for the game page', function() {
      expect(accessRouteConfig.get('game')).toEqual([
        { kind: 'game', pattern: '/games/:game_slug', params: ['game_slug'] },
      ]);
    });

    it('declares a character descriptor for a PC character page', function() {
      expect(accessRouteConfig.get('pcCharacter')).toEqual([{
        kind: 'character',
        characterKind: 'pcs',
        pattern: '/games/:game_slug/pcs/:character_id',
        params: ['game_slug', 'character_id'],
      }]);
    });

    it('declares a character descriptor for an NPC character page', function() {
      expect(accessRouteConfig.get('npcCharacter')).toEqual([{
        kind: 'character',
        characterKind: 'npcs',
        pattern: '/games/:game_slug/npcs/:character_id',
        params: ['game_slug', 'character_id'],
      }]);
    });

    it('declares both a superuser and a treasure descriptor for the treasure edit page', function() {
      expect(accessRouteConfig.get('treasureEdit')).toEqual([
        { kind: 'superuser' },
        { kind: 'treasure', pattern: '/treasures/:treasure_id/edit', params: ['treasure_id'] },
      ]);
    });

    it('declares a superuser-only descriptor for the treasures index page', function() {
      expect(accessRouteConfig.get('treasures')).toEqual([{ kind: 'superuser' }]);
    });

    it('declares a staffOrSuperuser-only descriptor for the staff users pages', function() {
      expect(accessRouteConfig.get('staffUsers')).toEqual([{ kind: 'staffOrSuperuser' }]);
      expect(accessRouteConfig.get('staffUser')).toEqual([{ kind: 'staffOrSuperuser' }]);
      expect(accessRouteConfig.get('staffUserEdit')).toEqual([{ kind: 'staffOrSuperuser' }]);
    });

    it('returns an empty array for pages without an access check', function() {
      expect(accessRouteConfig.get('games')).toEqual([]);
      expect(accessRouteConfig.get('home')).toEqual([]);
      expect(accessRouteConfig.get('gamePcs')).toEqual([]);
    });

    it('only uses recognized descriptor kinds', function() {
      const validKinds = ['game', 'character', 'treasure', 'superuser', 'staffOrSuperuser'];
      const pageKeys = [
        'game', 'gameEdit', 'gameNpcs', 'gamePhotos', 'gameTasks', 'gameTreasures', 'gameSessions',
        'gameNpcNew', 'gameSessionNew', 'gameTreasureNew', 'gameTreasureEdit',
        'pcCharacter', 'npcCharacter', 'pcCharacterEdit', 'npcCharacterEdit',
        'pcCharacterPhotos', 'npcCharacterPhotos', 'pcCharacterTreasures', 'npcCharacterTreasures',
        'treasure', 'treasureEdit', 'treasureNew', 'treasures',
        'staffUsers', 'staffUser', 'staffUserEdit',
      ];

      pageKeys.forEach((pageKey) => {
        const descriptors = accessRouteConfig.get(pageKey);

        expect(Array.isArray(descriptors)).toBe(true);
        descriptors.forEach((descriptor) => {
          expect(validKinds).toContain(descriptor.kind);
        });
      });
    });

    it('resolves the game kind from AccessRouteConfigStore once loaded', function() {
      spyOn(AccessRouteConfigStore, 'getKind').and.callFake((pageKey) => (
        pageKey === 'game' ? { kind: 'game' } : undefined
      ));

      expect(accessRouteConfig.get('game')).toEqual([
        { kind: 'game', pattern: '/games/:game_slug', params: ['game_slug'] },
      ]);
      expect(AccessRouteConfigStore.getKind).toHaveBeenCalledWith('game');
    });

    it('resolves the characterKind alongside the character kind', function() {
      spyOn(AccessRouteConfigStore, 'getKind').and.returnValue({ kind: 'character', characterKind: 'npcs' });

      expect(accessRouteConfig.get('pcCharacter')).toEqual([{
        kind: 'character',
        characterKind: 'npcs',
        pattern: '/games/:game_slug/pcs/:character_id',
        params: ['game_slug', 'character_id'],
      }]);
    });

    it('never looks up the fixed superuser/staffOrSuperuser descriptors in the store', function() {
      spyOn(AccessRouteConfigStore, 'getKind');

      accessRouteConfig.get('treasureNew');
      accessRouteConfig.get('staffUsers');

      expect(AccessRouteConfigStore.getKind).not.toHaveBeenCalled();
    });
  });
});
