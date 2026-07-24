import RequestPermissionResolvers from '../../../../../assets/js/utils/requests/RequestPermissionResolvers.js';
import AccessStore from '../../../../../assets/js/utils/access/store/AccessStore.js';

describe('RequestPermissionResolvers', function() {
  describe('.resolve', function() {
    it('resolves game-level permissions for the npc collection (GameEditPermission-backed)', function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      RequestPermissionResolvers.resolve('npc', 'collection', { gameSlug: 'demo' });

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
    });

    it('resolves character-level permissions for the npc single (CharacterEditPermission-backed)', function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      RequestPermissionResolvers.resolve('npc', 'single', { gameSlug: 'demo', id: '3' });

      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('npcs', 'demo', '3');
    });

    it('resolves character-level permissions for the pc single', function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      RequestPermissionResolvers.resolve('pc', 'single', { gameSlug: 'demo', id: '3' });

      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '3');
    });

    it('resolves no permissions for the pc collection (no restricted endpoint exists)', async function() {
      const result = await RequestPermissionResolvers.resolve('pc', 'collection', { gameSlug: 'demo' });

      expect(result).toEqual({});
    });

    it('resolves character-level permissions for item, for either kind', function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      RequestPermissionResolvers.resolve('item', 'collection', { gameSlug: 'demo', kind: 'npcs', id: '3' });
      RequestPermissionResolvers.resolve('item', 'single', { gameSlug: 'demo', kind: 'pcs', id: '3' });

      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('npcs', 'demo', '3');
      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('pcs', 'demo', '3');
    });

    it('resolves game-level permissions for item single with the game kind (GameItem)', function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      RequestPermissionResolvers.resolve('item', 'single', { gameSlug: 'demo', kind: 'game', id: '9' });

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
    });

    it('resolves game-level permissions for item collection with the game kind (GameItem)', function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      RequestPermissionResolvers.resolve('item', 'collection', { gameSlug: 'demo', kind: 'game' });

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
    });

    it('resolves game-level permissions for item.availableCollection regardless of kind (issue #773)', function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      RequestPermissionResolvers.resolve('item', 'availableCollection', { gameSlug: 'demo', kind: 'pcs', id: '3' });

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
    });

    it('resolves game-level permissions for the npc-kind treasure collection', function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      RequestPermissionResolvers.resolve('treasure', 'collection', { gameSlug: 'demo', kind: 'npcs', id: '3' });

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
    });

    it('resolves game-level permissions for the game-kind treasure collection', function() {
      spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      RequestPermissionResolvers.resolve('treasure', 'collection', { gameSlug: 'demo', kind: 'game' });

      expect(AccessStore.ensureGamePermissions).toHaveBeenCalledWith('demo');
    });

    it('resolves no permissions for the pc-kind treasure collection (no restricted endpoint exists)', async function() {
      const result = await RequestPermissionResolvers.resolve('treasure', 'collection', {
        gameSlug: 'demo', kind: 'pcs', id: '3',
      });

      expect(result).toEqual({});
    });

    it('resolves character-level permissions for document, for either kind', function() {
      spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({ can_edit: true }));

      RequestPermissionResolvers.resolve('document', 'collection', { gameSlug: 'demo', kind: 'npcs', id: '3' });

      expect(AccessStore.ensureCharacterPermissions).toHaveBeenCalledWith('npcs', 'demo', '3');
    });

    it('resolves no permissions for a resource/quantity-type with no restricted variant at all', async function() {
      const result = await RequestPermissionResolvers.resolve('game', 'collection', {});

      expect(result).toEqual({});
    });
  });
});
