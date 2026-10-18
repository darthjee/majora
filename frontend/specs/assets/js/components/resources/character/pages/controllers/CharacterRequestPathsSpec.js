import CharacterRequestPaths
  from '../../../../../../../../assets/js/components/resources/character/pages/controllers/CharacterRequestPaths.js';
import AccessStore from '../../../../../../../../assets/js/utils/access/store/AccessStore.js';

describe('CharacterRequestPaths', function() {
  let permissionsSpy;

  beforeEach(function() {
    permissionsSpy = spyOn(AccessStore, 'ensureCharacterPermissions').and.returnValue(Promise.resolve({}));
  });

  describe('.character', function() {
    it('resolves the plain npc path for a non-editor', async function() {
      expect(await CharacterRequestPaths.character('npcs', 'demo', '3')).toBe('/games/demo/npcs/3.json');
      expect(permissionsSpy).toHaveBeenCalledWith('npcs', 'demo', '3');
    });

    it('resolves the npc full.json path for an editor', async function() {
      permissionsSpy.and.returnValue(Promise.resolve({ can_edit: true }));

      expect(await CharacterRequestPaths.character('npcs', 'demo', '3')).toBe('/games/demo/npcs/3/full.json');
    });

    it('resolves the pc full.json path for an editor', async function() {
      permissionsSpy.and.returnValue(Promise.resolve({ can_edit: true }));

      expect(await CharacterRequestPaths.character('pcs', 'demo', '3')).toBe('/games/demo/pcs/3/full.json');
    });

    it('falls back to the plain path when the permission lookup fails', async function() {
      permissionsSpy.and.returnValue(Promise.reject(new Error('boom')));

      expect(await CharacterRequestPaths.character('npcs', 'demo', '3')).toBe('/games/demo/npcs/3.json');
    });
  });

  describe('.photos', function() {
    it('resolves the plain photos path for a pc, even for an editor', async function() {
      permissionsSpy.and.returnValue(Promise.resolve({ can_edit: true }));

      expect(await CharacterRequestPaths.photos('pcs', 'demo', '3')).toBe('/games/demo/pcs/3/photos.json');
    });

    it('resolves the plain photos path for an npc non-editor', async function() {
      expect(await CharacterRequestPaths.photos('npcs', 'demo', '3')).toBe('/games/demo/npcs/3/photos.json');
    });

    it('resolves the photos/all.json path for an npc editor', async function() {
      permissionsSpy.and.returnValue(Promise.resolve({ can_edit: true }));

      expect(await CharacterRequestPaths.photos('npcs', 'demo', '3')).toBe('/games/demo/npcs/3/photos/all.json');
    });

    it('falls back to the plain path when the permission lookup fails', async function() {
      permissionsSpy.and.returnValue(Promise.reject(new Error('boom')));

      expect(await CharacterRequestPaths.photos('npcs', 'demo', '3')).toBe('/games/demo/npcs/3/photos.json');
    });
  });
});
