import RequestPermissionResolvers from '../../../../../assets/js/utils/requests/RequestPermissionResolvers.js';
import AccessStore from '../../../../../assets/js/utils/access/store/AccessStore.js';

describe('RequestPermissionResolvers (issue #1616)', function() {
  describe('.resolve', function() {
    let gameSpy;
    let characterSpy;

    beforeEach(function() {
      gameSpy = spyOn(AccessStore, 'ensureGamePermissions').and.returnValue(Promise.resolve({ can_edit: true }));
      characterSpy = spyOn(AccessStore, 'ensureCharacterPermissions')
        .and.returnValue(Promise.resolve({ can_edit: true }));
    });

    it('resolves game-level permissions for an npc treasure ownedCollection', async function() {
      const result = await RequestPermissionResolvers.resolve(
        'treasure', 'ownedCollection', { gameSlug: 'demo', kind: 'npcs', id: '3' },
      );

      expect(gameSpy).toHaveBeenCalledWith('demo');
      expect(result).toEqual({ can_edit: true });
    });

    it('resolves no permissions for a pc treasure ownedCollection', async function() {
      const result = await RequestPermissionResolvers.resolve(
        'treasure', 'ownedCollection', { gameSlug: 'demo', kind: 'pcs', id: '3' },
      );

      expect(gameSpy).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('resolves game-level permissions for the game-scoped treasure single', async function() {
      await RequestPermissionResolvers.resolve('treasure', 'single', { gameSlug: 'demo', id: '9' });

      expect(gameSpy).toHaveBeenCalledWith('demo');
    });

    it('resolves no permissions for the standalone treasure single', async function() {
      const result = await RequestPermissionResolvers.resolve('treasure', 'single', { id: '9' });

      expect(gameSpy).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('resolves character-level permissions for the treasure summary, for either kind', async function() {
      await RequestPermissionResolvers.resolve('treasure', 'summary', {
        gameSlug: 'demo', treasureId: '9', kind: 'npcs', id: '3',
      });
      await RequestPermissionResolvers.resolve('treasure', 'summary', {
        gameSlug: 'demo', treasureId: '9', kind: 'pcs', id: '4',
      });

      expect(characterSpy).toHaveBeenCalledWith('npcs', 'demo', '3');
      expect(characterSpy).toHaveBeenCalledWith('pcs', 'demo', '4');
    });

    it('resolves character-level permissions for an npc characterPhoto collection', async function() {
      await RequestPermissionResolvers.resolve('characterPhoto', 'collection', { gameSlug: 'demo', kind: 'npcs', id: '3' });

      expect(characterSpy).toHaveBeenCalledWith('npcs', 'demo', '3');
    });

    it('resolves no permissions for a pc characterPhoto collection', async function() {
      const result = await RequestPermissionResolvers.resolve(
        'characterPhoto', 'collection', { gameSlug: 'demo', kind: 'pcs', id: '3' },
      );

      expect(characterSpy).not.toHaveBeenCalled();
      expect(result).toEqual({});
    });

    ['characterDocumentPhoto', 'characterDocumentFile'].forEach((resource) => {
      it(`resolves character-level permissions for the ${resource} collection`, async function() {
        await RequestPermissionResolvers.resolve(resource, 'collection', {
          gameSlug: 'demo', kind: 'npcs', characterId: '3', documentId: '5',
        });

        expect(characterSpy).toHaveBeenCalledWith('npcs', 'demo', '3');
      });
    });
  });
});
