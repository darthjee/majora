import AccessStoreDescriptor from '../../../../assets/js/utils/AccessStoreDescriptor.js';

/**
 * @description Builds a fake `AccessStore`-shaped object whose ensure* methods are spies
 *   resolving to `undefined`, for asserting which ones {@link AccessStoreDescriptor.ensure} calls.
 * @returns {object} A jasmine spy object covering every `AccessStore.ensure*` method.
 */
function buildStore() {
  return jasmine.createSpyObj('store', [
    'ensureSuperUser', 'ensureStaffOrSuperUser',
    'ensureGameAccess', 'ensureGamePermissions',
    'ensureTreasureAccess', 'ensureTreasurePermissions',
    'ensureCharacterAccess', 'ensureCharacterPermissions',
  ]);
}

describe('AccessStoreDescriptor', function() {
  describe('#ensure', function() {
    it('calls only ensureSuperUser for a superuser descriptor', function() {
      const store = buildStore();

      AccessStoreDescriptor.ensure({ kind: 'superuser' }, '#/', store);

      expect(store.ensureSuperUser).toHaveBeenCalled();
      expect(store.ensureGameAccess).not.toHaveBeenCalled();
    });

    it('calls only ensureStaffOrSuperUser for a staffOrSuperuser descriptor', function() {
      const store = buildStore();

      AccessStoreDescriptor.ensure({ kind: 'staffOrSuperuser' }, '#/', store);

      expect(store.ensureStaffOrSuperUser).toHaveBeenCalled();
    });

    it('calls both ensureGameAccess and ensureGamePermissions for a game descriptor', function() {
      const store = buildStore();
      const descriptor = { kind: 'game', pattern: '/games/:game_slug', params: ['game_slug'] };

      AccessStoreDescriptor.ensure(descriptor, '#/games/demo', store);

      expect(store.ensureGameAccess).toHaveBeenCalledWith('demo');
      expect(store.ensureGamePermissions).toHaveBeenCalledWith('demo', []);
    });

    it('calls both ensureTreasureAccess and ensureTreasurePermissions for a treasure descriptor', function() {
      const store = buildStore();
      const descriptor = { kind: 'treasure', pattern: '/treasures/:treasure_id', params: ['treasure_id'] };

      AccessStoreDescriptor.ensure(descriptor, '#/treasures/42', store);

      expect(store.ensureTreasureAccess).toHaveBeenCalledWith('42');
      expect(store.ensureTreasurePermissions).toHaveBeenCalledWith('42', []);
    });

    it('calls both ensureCharacterAccess and ensureCharacterPermissions for a character descriptor', function() {
      const store = buildStore();
      const descriptor = {
        kind: 'character', characterKind: 'pcs',
        pattern: '/games/:game_slug/pcs/:character_id', params: ['game_slug', 'character_id'],
      };

      AccessStoreDescriptor.ensure(descriptor, '#/games/demo/pcs/2', store);

      expect(store.ensureCharacterAccess).toHaveBeenCalledWith('pcs', 'demo', '2');
      expect(store.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '2', []);
    });

    it('forwards the descriptor-declared roles to the permissions ensure calls', function() {
      const store = buildStore();
      const descriptor = {
        kind: 'game', pattern: '/games/:game_slug', params: ['game_slug'], roles: ['dm'],
      };

      AccessStoreDescriptor.ensure(descriptor, '#/games/demo', store);

      expect(store.ensureGamePermissions).toHaveBeenCalledWith('demo', ['dm']);
    });
  });
});
