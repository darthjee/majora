import AccessStoreDescriptor from '../../../../../../assets/js/utils/access/store/AccessStoreDescriptor.js';

/**
 * @description Builds a fake `AccessStore`-shaped object whose ensure* methods are spies
 *   resolving to `undefined`, for asserting which ones {@link AccessStoreDescriptor.ensure} calls.
 * @returns {object} A jasmine spy object covering every `AccessStore.ensure*` method.
 */
function buildStore() {
  const store = jasmine.createSpyObj('store', [
    'ensureSuperUser', 'ensureStaffOrSuperUser',
    'ensureGameAccess', 'ensureGamePermissions',
    'ensureTreasureAccess', 'ensureTreasurePermissions',
    'ensureCharacterAccess', 'ensureCharacterPermissions',
  ]);

  store.ensureGameAccess.and.returnValue(Promise.resolve({}));
  store.ensureTreasureAccess.and.returnValue(Promise.resolve({}));
  store.ensureCharacterAccess.and.returnValue(Promise.resolve({}));
  store.ensureGamePermissions.and.returnValue(Promise.resolve({ can_edit: false }));
  store.ensureTreasurePermissions.and.returnValue(Promise.resolve({ can_edit: false }));
  store.ensureCharacterPermissions.and.returnValue(Promise.resolve({ can_edit: false }));

  return store;
}

describe('AccessStoreDescriptor', function() {
  describe('#ensure', function() {
    it('calls only ensureSuperUser for a superuser descriptor', async function() {
      const store = buildStore();

      await AccessStoreDescriptor.ensure({ kind: 'superuser' }, '#/', store);

      expect(store.ensureSuperUser).toHaveBeenCalled();
      expect(store.ensureGameAccess).not.toHaveBeenCalled();
    });

    it('calls only ensureStaffOrSuperUser for a staffOrSuperuser descriptor', async function() {
      const store = buildStore();

      await AccessStoreDescriptor.ensure({ kind: 'staffOrSuperuser' }, '#/', store);

      expect(store.ensureStaffOrSuperUser).toHaveBeenCalled();
    });

    it('calls ensureGameAccess before ensureGamePermissions for a game descriptor', async function() {
      const store = buildStore();
      const descriptor = { kind: 'game', pattern: '/games/:game_slug', params: ['game_slug'] };

      await AccessStoreDescriptor.ensure(descriptor, '#/games/demo', store);

      expect(store.ensureGameAccess).toHaveBeenCalledWith('demo');
      expect(store.ensureGamePermissions).toHaveBeenCalledWith('demo');
    });

    it('awaits ensureGameAccess before ever calling ensureGamePermissions', function() {
      const store = buildStore();
      let resolveAccess;
      store.ensureGameAccess.and.returnValue(new Promise((resolve) => {
        resolveAccess = resolve;
      }));
      const descriptor = { kind: 'game', pattern: '/games/:game_slug', params: ['game_slug'] };

      AccessStoreDescriptor.ensure(descriptor, '#/games/demo', store);

      expect(store.ensureGamePermissions).not.toHaveBeenCalled();
      resolveAccess({});
    });

    it('calls only ensureTreasureAccess (not ensureTreasurePermissions) for a treasure descriptor', async function() {
      const store = buildStore();
      const descriptor = { kind: 'treasure', pattern: '/treasures/:treasure_id', params: ['treasure_id'] };

      await AccessStoreDescriptor.ensure(descriptor, '#/treasures/42', store);

      expect(store.ensureTreasureAccess).toHaveBeenCalledWith('42');
      expect(store.ensureTreasurePermissions).not.toHaveBeenCalled();
    });

    it('calls ensureCharacterAccess before ensureCharacterPermissions for a character descriptor', async function() {
      const store = buildStore();
      const descriptor = {
        kind: 'character', characterKind: 'pcs',
        pattern: '/games/:game_slug/pcs/:character_id', params: ['game_slug', 'character_id'],
      };

      await AccessStoreDescriptor.ensure(descriptor, '#/games/demo/pcs/2', store);

      expect(store.ensureCharacterAccess).toHaveBeenCalledWith('pcs', 'demo', '2');
      expect(store.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '2');
    });
  });
});
